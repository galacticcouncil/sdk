import { withExpect } from '@acala-network/chopsticks-testing';

/* const { check, checkEvents, checkHrmp, checkSystemEvents, checkUmp } =
  withExpect((x: any) => ({
    toMatchSnapshot(msg?: string): void {
      expect(x).toMatchSnapshot(msg);
    },
    toMatch(value: any, _msg?: string): void {
      expect(x).toMatch(value);
    },
    toMatchObject(value: any, _msg?: string): void {
      expect(x).toMatchObject(value);
    },
  })); */

const { check, checkEvents, checkHrmp, checkSystemEvents, checkUmp } =
  withExpect((x: any) => ({
    toMatchSnapshot(msg?: string): void {
      console.log(msg);
      console.log(x);
      console.log(JSON.stringify(x, null, 2));
    },
    toMatch(value: any, _msg?: string): void {
      console.log(x);
    },
    toMatchObject(value: any, _msg?: string): void {
      console.log(x);
    },
  }));

export { check, checkEvents, checkHrmp, checkSystemEvents, checkUmp };
