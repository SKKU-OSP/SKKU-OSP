import { create } from 'zustand';

const useCaseNumStore = create((set) => ({
  caseNum: 0,
  absence: true,
  major: true,
  handleAbsenceSwitch: (e) => {
    set((state) => {
      return {
        absence: !e.target.checked,
        caseNum: (state.absence << 1) | state.major
      };
    });
  },
  handleMajorSwitch: (e) => {
    set((state) => {
      return {
        major: !e.target.checked,
        caseNum: (state.absence << 1) | state.major
      };
    });
  }
}));

export { useCaseNumStore };
