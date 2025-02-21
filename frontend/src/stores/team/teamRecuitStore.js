import { set } from 'react-ga';
import { create } from 'zustand';

export const useRecruitStore = create(() => ({
  recruitPage: 1,
  showRecruitDropdown: false,
  recruitSortOrders: '-id',
  setRecruitPage: (page) => ({ recruitPage: page }),
  setShowRecruitDropdown: (show) => ({ showRecruitDropdown: show }),
  setRecruitSortOrders: (sort) => ({ recruitSortOrders: sort })
}));

export const useTeamStore = create(() => ({
  teamPage: 1,
  showTeamDropdown: false,
  teamSortOrders: '-id',
  setTeamPage: (page) => ({ teamPage: page }),
  setShowTeamDropdown: (show) => ({ showTeamDropdown: show }),
  setTeamSortOrders: (sort) => ({ teamSortOrders: sort })
}));
