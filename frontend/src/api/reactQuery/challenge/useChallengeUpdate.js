import { useQuery } from '@tanstack/react-query';
import { getChallengeUpdate } from '../../endpoints/challenge/getChallengeUpdate';

export const useChallengeUpdate = (userId) => {
  const query = useQuery({
    queryKey: ['challengeUpdate'],
    queryFn: getChallengeUpdate,
    config: {
      enabled: !!userId
    }
  });
  return query;
};
