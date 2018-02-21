import {ExecPromised} from "./exec-promised";

describe('Class: ExecPromised', () => {
    it('calls child_process.exec', async () => {
        // given
        const expectedResponse = 'expected response';
        const givenCommand = `echo "${expectedResponse}"`;

        // when
        const actualResult = await ExecPromised.exec(givenCommand);

        // then
        expect(actualResult.stdout).toEqual(expectedResponse+'\n');
    });
    it('rejects the promise if child_process.exec returns != 0', async () => {
        // given
        const expectedCode = 1;
        const givenCommand = 'false';

        // when
        await ExecPromised.exec(givenCommand)
            .then(result => fail(result))
            // then
            .catch(error =>
                expect(error.code).toEqual(expectedCode));
    });
});