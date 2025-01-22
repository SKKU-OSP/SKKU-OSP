import { create } from 'zustand';

// export const useChartDataStore = create((set) => ({
//   chartData: {
//     annual_data: { factor: [] },
//     annual_overview: [],
//     annual_total: [],
//     depts: [],
//     factors: [],
//     sids: [],
//     student_data: {},
//     years: []
//   },
//   setChartData: (data) => set({ chartData: data })

//     // caseNum에 따라 필터링된 데이터 제공
//     getOverviewData: () => {
//       const { caseNum } = useChartFilterStore.getState();
//       const { annual_overview } = get().chartData;
//       return annual_overview.filter((data) => data.caseNum === caseNum);
//     }
// }));

export const useChartFilterStore = create((set) => ({
  caseNum: 0,
  absence: true,
  major: true,
  year: 2019,
  toggleAbsence: () =>
    set((state) => {
      const newAbsence = !state.absence;
      const newCaseNum = (newAbsence << 1) | state.major;
      return { absence: newAbsence, caseNum: newCaseNum };
    }),
  toggleMajor: () =>
    set((state) => {
      const newMajor = !state.major;
      const newCaseNum = (state.absence << 1) | newMajor;
      return { major: newMajor, caseNum: newCaseNum };
    }),
  setYear: (year) => set({ year })
}));
