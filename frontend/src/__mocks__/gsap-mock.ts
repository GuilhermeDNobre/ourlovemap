const makeTween = () => ({ kill: jest.fn(), scrollTrigger: null });

const gsap = {
  to: jest.fn().mockImplementation(() => makeTween()),
  set: jest.fn(),
  registerPlugin: jest.fn(),
};

export default gsap;
