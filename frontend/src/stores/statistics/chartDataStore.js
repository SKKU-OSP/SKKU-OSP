import { create } from 'zustand';

export const useChartDataStore = create((set) => ({
  chartData: null,
  setChartData: (data) => set({ chartData: data })
}));

export const useChartFilterStore = create((set) => ({
  caseNum: 0,
  absence: true,
  major: true,
  year: 2019,
  toggleAbsence: () => set((state) => ({ absence: !state.absence })),
  toggleMajor: () => set((state) => ({ major: !state.major })),
  setYear: (year) => set({ year }),
  setCaseNum: () => set((state) => ({ caseNum: (state.absence << 1) | state.major }))
}));
