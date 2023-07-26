import { IntervalTrigger } from '../src/interval-trigger';

jest.useFakeTimers();

describe('Given IntervalTrigger', () => {
  const mockEmit = jest.fn();

  beforeEach(() => {
    mockEmit.mockClear();
  });

  describe('When IntervalTrigger created', function () {
    let trigger: IntervalTrigger;

    beforeEach(() => {
      trigger = new IntervalTrigger({ interval: 2 });
      trigger.on('update', mockEmit);
    });

    describe('And trigger started', () => {
      beforeEach(async () => {
        jest.clearAllTimers();
        await trigger.start();
      });

      it('Then update event is not emitted before time has come', () => {
        jest.advanceTimersByTime(1000);
        expect(mockEmit).toHaveBeenCalledTimes(0);
      });

      it('Then update event is emitted in 2 seconds', () => {
        jest.advanceTimersByTime(2000);
        expect(mockEmit).toHaveBeenCalledTimes(1);
      });

      it('Then update event is emitted in 4 seconds', () => {
        jest.advanceTimersByTime(4000);
        expect(mockEmit).toHaveBeenCalledTimes(1);
      });
    });
  });
});
