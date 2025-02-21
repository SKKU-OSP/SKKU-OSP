import { useQuery } from '@tanstack/react-query';
import { getTeamList } from '../../endpoints/team/getTeamList';

export const useTeamList = (page, sort) => {
  const query = useQuery({
    queryKey: ['teamList', page, sort],
    queryFn: () => getTeamList(page, sort),
    initialData: { articles: [], max_page_number: 0 }
  });
  return query;
};
