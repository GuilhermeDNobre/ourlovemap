const makeTween = () => ({ kill: jest.fn(), scrollTrigger: null });

const makeTimeline = () => ({
  to: jest.fn().mockReturnThis(),
  fromTo: jest.fn().mockReturnThis(),
  kill: jest.fn(),
  scrollTrigger: null,
  revert: jest.fn(),
});

const gsap = {
  to: jest.fn().mockImplementation(() => makeTween()),
  set: jest.fn(),
  registerPlugin: jest.fn(),
  timeline: jest.fn().mockImplementation(() => makeTimeline()),
  context: jest.fn().mockImplementation((cb) => {
    if (typeof cb === 'function') cb();
    return { revert: jest.fn() };
  }),
};

export { gsap };
export default gsap;
