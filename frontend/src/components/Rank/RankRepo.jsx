import { useState, useRef, useMemo, useCallback, useEffect } from 'react';

import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component
import { BsSearch } from 'react-icons/bs';

import axios from 'axios';

import { getAuthConfig } from '../../utils/auth';
import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './Rank.css';
import ContribModal from './ContribModal';

const serverDomain = import.meta.env.VITE_SERVER_URL;
function RankRepo() {
  const gridRef = useRef(); // Optional - for accessing Grid's API

  const [rowData, setRowData] = useState();
  const [contribData, setContribData] = useState([]);
  const [show, setShow] = useState(false);

  const cellRenderer = () => {
    return <BsSearch />;
  };

  // Column 세팅 값
  const columnDefs = [
    { field: 'repo_link', headerName: 'Repository', width: 200 },
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
    { field: 'contrib', headerName: '기여학생', cellRenderer: cellRenderer, width: 80 }
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
      const url = serverDomain + '/rank/api/repo/';
      const response = await axios.get(url, getAuthConfig());
      const res = response.data;
      if (res.status === 'success') {
        setRowData(res.data.repos);
      } else {
        console.log(res.errors);
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
    const url = serverDomain + '/rank/api/contrib/' + `?github_id=${github_id}&repo_name=${repo_name}`;
    const response = await axios.get(url, getAuthConfig());
    const res = response.data;
    if (res.status === 'success') {
      setContribData(res.data);
    } else {
      console.log('fail');
    }
  };

  const onCellClicked = (event) => {
    if (event.colDef.field === 'contrib') {
      getRepoContrib(event.data.github_id, event.data.repo_name);
      setShow(true);
    }
  };

  return (
    <>
      <div className="d-flex flex-column justify-content-center" style={{ maxWidth: 1000 }}>
        <div className="d-flex justify-content-end gap-2">
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
      </div>
      {contribData.length > 0 && <ContribModal show={show} setShow={setShow} contribData={contribData} />}
    </>
  );
}

export default RankRepo;
