import { create } from 'zustand';

export const useChartFilterStore = create((set) => ({
  caseNum: 0,
  absence: true,
  major: true,
  year: 2019,
  toggleAbsence: () =>
    set((state) => {
      const newAbsence = !state.absence;
      const newCaseNum = (!newAbsence << 1) | !state.major;
      return { absence: newAbsence, caseNum: newCaseNum };
    }),
  toggleMajor: () =>
    set((state) => {
      const newMajor = !state.major;
      const newCaseNum = (!state.absence << 1) | !newMajor;
      return { major: newMajor, caseNum: newCaseNum };
    }),
  setYear: (year) => set({ year })
}));
