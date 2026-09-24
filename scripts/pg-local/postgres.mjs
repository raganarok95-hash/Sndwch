// SND//WCH — scripts/pg-local/postgres
// Levanta un Postgres PROPIO y descartable para las pruebas, sin exigir uno configurado: así las
// comprobaciones corren en cualquier máquina en vez de saltarse en silencio donde falte una
// variable de entorno. Lo usan check-backup (restaurar el respaldo) y check-pg (el esquema real
// y las funciones de la base).
//
// Con CHECK_BACKUP_PG definido usa ese servidor en vez de levantar uno.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, chmodSync, globSync } from 'node:fs';
import { join } from 'node:path';

export function binPostgres() {
  return [...globSync('/usr/lib/postgresql/*/bin'), ...globSync('/usr/local/pgsql/bin'), ''].find(
    (d) => existsSync(join(d, 'initdb')),
  );
}

export function levantarPostgres() {
  if (process.env.CHECK_BACKUP_PG) return { url: process.env.CHECK_BACKUP_PG, parar() {} };

  const bin = binPostgres();
  if (bin === undefined) return null;

  const base = mkdtempSync(join('/var/tmp', 'sndwch-pgtest-'));
  const datos = join(base, 'datos');
  const puerto = 5000 + (process.pid % 20000);
  // initdb se niega a correr como root. En este contenedor la sesión ES root, en un runner
  // de GitHub no — así que se resuelven los dos casos en vez de asumir uno.
  const comoRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  const correrPg = (cmd) =>
    comoRoot
      ? execFileSync('su', ['postgres', '-c', cmd], { stdio: 'pipe' })
      : execFileSync('sh', ['-c', cmd], { stdio: 'pipe' });
  if (comoRoot) {
    chmodSync(base, 0o777);
    execFileSync('chown', ['postgres:postgres', base], { stdio: 'pipe' });
  }
  correrPg(`${join(bin, 'initdb')} -D ${datos} -U postgres --auth=trust -E UTF8`);
  // El `-l` no es cosmético: sin él el servidor hereda la salida de pg_ctl, ese pipe nunca
  // se cierra mientras Postgres siga vivo, y execFileSync se queda esperando para siempre a
  // un proceso que ya terminó.
  correrPg(`${join(bin, 'pg_ctl')} -D ${datos} -o '-p ${puerto} -k ${base}' -l ${join(base, 'servidor.log')} -w start`);
  const url = `postgresql://postgres@/postgres?host=${base}&port=${puerto}`;
  return {
    url,
    parar() {
      try {
        correrPg(`${join(bin, 'pg_ctl')} -D ${datos} -m immediate stop`);
      } catch {}
      rmSync(base, { recursive: true, force: true });
    },
  };
}
