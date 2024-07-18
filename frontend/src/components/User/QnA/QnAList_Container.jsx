import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../../utils/auth-context';
import { getAuthConfig } from '../../../utils/auth';
import QnAList_Presenter from './QnAList_Presenter';
import Pagination from 'react-bootstrap/Pagination';
import LoaderIcon from 'react-loader-icon';
import { useNavigate } from 'react-router-dom';

const domain_url = import.meta.env.VITE_SERVER_URL;

const QnAList_Container = () => {
  const { username } = useContext(AuthContext);
  const navigate = useNavigate();
  const [qnas, setQnas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (username !== 'admin') {
          window.alert('접근 권한이 없습니다. 메인 페이지로 이동합니다.');
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking user permissions:', error);
        window.alert('사용자 정보를 확인하는 중 오류가 발생했습니다. 메인 페이지로 이동합니다.');
        navigate('/');
      }
    };

    const fetchQnAs = async () => {
      try {
        const qna_url = `${domain_url}/user/api/qna/`;
        const response = await axios.get(qna_url, getAuthConfig());
        setQnas(response.data.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching QnAs:', error);
        setIsLoading(false);
      }
    };

    checkPermissions();
    fetchQnAs();
  }, [username, navigate]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = qnas.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      {isLoading ? (
        <LoaderIcon style={{ marginTop: '20px' }} />
      ) : (
        <>
          <QnAList_Presenter qnas={currentItems} />
          <Pagination>
            {Array.from({ length: Math.ceil(qnas.length / itemsPerPage) }, (_, i) => (
              <Pagination.Item key={i} active={i + 1 === currentPage} onClick={() => paginate(i + 1)}>
                {i + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </>
      )}
    </div>
  );
};

export default QnAList_Container;
