import '@testing-library/jest-dom';

describe('Utils', () => {
  it('should equal 1', () => {
    expect(1).toEqual(1);
  });

  it('should get list of items from set', () => {
    const s1 = new Set([1, 2, 3, 4, 5, 5]);
    const arr = [...s1].filter((v) => v === 1);
    expect(arr.length).toEqual(1);
    expect(arr[0]).toEqual(1);
  });

  it('should get the correct alert messaage for each type', () => {
    enum AlertType {
      Info = 1,
      Success,
      Caution,
      Warning,
    }

    const alertMessage = {
      1: 'This is an info message.',
      2: 'Some success message',
      3: 'abc',
      4: 'def',
    };
    expect(alertMessage[AlertType.Success]).toBe('Some success message');
  });
});
