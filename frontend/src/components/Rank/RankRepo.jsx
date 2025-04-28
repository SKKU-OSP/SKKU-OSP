import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import axios from 'axios';
import axiosInstance from '../../utils/axiosInterCeptor';
import { AgGridReact } from 'ag-grid-react';

import { BsSearch } from 'react-icons/bs';

import ContribModal from './ContribModal';
import PageJump from './PageJump';
import { getAuthConfig } from '../../utils/auth';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import './Rank.css';

const serverDomain = import.meta.env.VITE_SERVER_URL;
function RankRepo() {
  const gridRef = useRef(); // Optional - for accessing Grid's API

  const [rowData, setRowData] = useState();
  const [contribData, setContribData] = useState([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  const cellRenderer = () => {
    return <BsSearch />;
  };

  // Column 세팅 값
  const columnDefs = [
    { field: 'repo_link', headerName: 'Repository', width: 200, cellClass: 'rank-cell link-cell' },
    { field: 'stargazers_count', headerName: 'Stars', width: 80, sort: 'desc' },
    { field: 'forks_count', headerName: 'Forks', width: 80 },
    { field: 'commits_count', headerName: 'Commits', width: 90 },
    { field: 'prs_count', headerName: 'PRs', width: 80 },
    { field: 'issues_count', headerName: 'Issuses', width: 80 },
    { field: 'watchers_count', headerName: 'Watchers', width: 90 },
    { field: 'language', width: 100 },
    {
      field: 'contributors_count',
      headerName: 'Contributors',
      width: 100
    },
    {
      field: 'contribCount',
      headerName: '기여학생 수',
      width: 70
    },
    {
      field: 'contrib',
      headerName: '기여학생',
      cellRenderer: cellRenderer,
      width: 80,
      cellClass: 'rank-cell link-cell'
    }
  ];

  // 기본 세팅 값
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      headerClass: 'rank-header',
      cellClass: 'rank-cell',
      resizable: true
    }),
    []
  );

  useEffect(() => {
    const getUserRank = async () => {
      try {
        const url = serverDomain + '/rank/api/repo/';
        const response = await axiosInstance.get(url, getAuthConfig());
        const res = response.data;
        const addContribCount = res.data.repos.map((item) => ({
          ...item,
          contribCount: item.contribs.length
        }));
        console.log(addContribCount);
        if (res.status === 'success') {
          setRowData(addContribCount);
        } else {
          console.log(res.message);
          setError(res.message);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    getUserRank();
  }, []);

  const clearFilters = useCallback(() => {
    gridRef.current.api.setFilterModel(null);
  }, []);

  const onBtnExport = useCallback(() => {
    gridRef.current.api.exportDataAsCsv();
  }, []);

  const getRepoContrib = async (github_id, repo_name) => {
    try {
      const url = serverDomain + '/rank/api/contrib/' + `?github_id=${github_id}&repo_name=${repo_name}`;
      const response = await axiosInstance.get(url, getAuthConfig());
      const res = response.data;
      if (res.status === 'success') {
        setContribData(res.data);
        setShow(true);
      } else {
        setShow(false);
        alert(res.message);
      }
    } catch (err) {
      setShow(false);
      alert(err.message);
    }
  };

  const onCellClicked = (event) => {
    if (event.colDef.field === 'repo_link') {
      const repoUrl = `https://github.com/${event.data.repo_link}`;
      window.open(repoUrl, '_blank');
    }
    if (event.colDef.field === 'contrib') {
      getRepoContrib(event.data.github_id, event.data.repo_name);
    }
  };

  return (
    <>
      {error && <div>{error}</div>}
      {!error && (
        <>
          <div className="m-auto" style={{ maxWidth: 1000 }}>
            <div className="d-flex justify-content-end gap-2 mb-2">
              <button className="btn btn-success" onClick={onBtnExport}>
                Export CSV
              </button>
              <button className="btn btn-success" onClick={clearFilters}>
                Clear Filter
              </button>
            </div>

            <div className="ag-theme-alpine" style={{ width: '100%', height: 520 }}>
              <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows={true}
                rowSelection="multiple"
                pagination={true}
                paginationPageSize={10}
                onCellClicked={onCellClicked}
              />
            </div>
            <PageJump gridRef={gridRef} />
          </div>
          {contribData.length > 0 && <ContribModal show={show} setShow={setShow} contribData={contribData} />}
        </>
      )}
    </>
  );
}

export default RankRepo;
