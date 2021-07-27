

export abstract class Migrations {
  abstract upgrade();
  abstract downgrade();
  abstract clear();
  abstract setup();
}
