import { useQuery } from '@tanstack/react-query';
import { getChallengeList } from '../../endpoints/challenge/getChallegeList';

export const useChallengeList = (userId) => {
  const query = useQuery({
    queryKey: ['challengeList'],
    queryFn: getChallengeList,
    config: {
      enabled: !!userId
    }
  });
  return query;
};
