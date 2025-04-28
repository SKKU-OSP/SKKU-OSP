import Article_Presenter from './Article_Presenter';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';
import LoaderIcon from 'react-loader-icon';
import AuthContext from '../../../utils/auth-context';
import { getAuthConfig } from '../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

function Article_Container() {
  const [data, setData] = useState(null);
  const [canView, setCanView] = useState(false);
  const [error, setError] = useState(false);
  const { article_id } = useParams();
  const { username } = useContext(AuthContext);

  useEffect(() => {
    const getArticle = async () => {
      try {
        const url = server_url + '/community/api/article/' + article_id + '/';
        const response = await axiosInstance.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          if (res.data.board.board_type == 'Team') {
            try {
              const teams_url = server_url + '/team/api/teams-of-user-list/';
              const response = await axiosInstance.get(teams_url, getAuthConfig());
              const resTeam = response.data;
              const teams = resTeam.data.teams_of_user;

              teams.map((team) => {
                if (res.data.board.team_id === team.id) {
                  setCanView(true);
                }
              });
            } catch (e) {
              console.log(e.message);
              setError(e.message);
            }
          } else {
            setCanView(true);
          }
          setData(res.data);
        }
      } catch (error) {
        console.log(error);
        setError(true);
      }
    };
    getArticle();
  }, [article_id]);

  return (
    <>
      {data ? (
        <Article_Presenter data={data} canView={canView} setData={setData} username={username} />
      ) : (
        <div className="col-9">
          <LoaderIcon style={{ marginTop: '50px' }} />
        </div>
      )}
    </>
  );
}
export default Article_Container;
