import { useQuery } from '@tanstack/react-query';
import { getBoardList } from '../../endpoints/community/getBoardList';

export const useBoardList = (tabName, page, sort) => {
  const query = useQuery({
    queryKey: ['boardList', tabName, page, sort],
    queryFn: () => getBoardList(tabName, page, sort),
    initialData: { articles: [], max_page_number: 0 }
  });
  return query;
};
