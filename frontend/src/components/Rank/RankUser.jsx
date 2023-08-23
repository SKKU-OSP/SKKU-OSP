import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import axios from 'axios';

import { getAuthConfig } from '../../utils/auth';
import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import './Rank.css';

const serverDomain = import.meta.env.VITE_SERVER_URL;
function RankUser() {
  const gridRef = useRef(); // Optional - for accessing Grid's API
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const targetYear = searchParams.get('year');
  const [rowData, setRowData] = useState();
  const [years, setYears] = useState();

  // Column 세팅 값
  const columnDefs = [
    { field: 'id', width: 130, hide: true },
    { field: 'rank', width: 80 },
    { field: 'name', width: 100 },
    { field: 'dept', width: 120, headerName: '학과' },
    { field: 'absence_label', width: 70, headerName: '재/휴학' },
    { field: 'plural_major_label', width: 90, headerName: '전공구분' },
    { field: 'github_id', width: 120, headerName: 'GitHub ID' },
    {
      field: 'year',
      width: 60,
      filter: true,
      filterParams: {
        filterOptions: ['equal'],
        defaultOption: 'equal'
      },
      filterValueGetter: 2022
    },
    { field: 'score', width: 80, sort: 'desc', filter: 'agNumberColumnFilter' },
    { field: 'commit_cnt', headerName: 'Commits', width: 80 },
    { field: 'commit_line', headerName: 'Commit lines', width: 120 },
    { field: 'issue_cnt', headerName: 'Issuses', width: 80 },
    { field: 'pr_cnt', headerName: 'PRs', width: 80 },
    { field: 'repo_cnt', headerName: 'Repos', width: 80 }
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
      let url = serverDomain + '/rank/api/user/';
      if (targetYear) url += `?year=${targetYear}`;
      const response = await axios.get(url, getAuthConfig());
      const res = response.data;
      if (res.status === 'success') {
        setRowData(res.data.score_table);
        setYears(res.data.years);
      } else {
        console.log(res.errors);
      }
    };
    getUserRank();
  }, [targetYear]);

  const clearFilters = useCallback(() => {
    gridRef.current.api.setFilterModel(null);
  }, []);

  const onBtnExport = useCallback(() => {
    gridRef.current.api.exportDataAsCsv();
  }, []);

  const navigateYear = (year) => {
    if (year) navigate(`/rank/user/?year=${year}`);
    else navigate(`/rank/user/`);
  };

  return (
    <>
      <div className="d-flex flex-column justify-content-center" style={{ maxWidth: 1180 }}>
        <div className="d-flex justify-content-between">
          <DropdownButton id="dropdown-basic-button" title={targetYear ? targetYear : '전체연도'}>
            {years &&
              years.map((year) => {
                return (
                  <Dropdown.Item
                    key={year}
                    eventKey={year}
                    onClick={() => {
                      navigateYear(year);
                    }}
                    active={String(year) === targetYear}
                  >
                    {year}
                  </Dropdown.Item>
                );
              })}
            <Dropdown.Item
              eventKey="all"
              onClick={() => {
                navigateYear(null);
              }}
              active={targetYear === null}
            >
              전체연도
            </Dropdown.Item>
          </DropdownButton>
          <div>
            <button className="btn btn-success" onClick={onBtnExport}>
              Export
            </button>
            <button className="btn btn-success" onClick={clearFilters}>
              Clear Filter
            </button>
          </div>
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
          />
        </div>
      </div>
    </>
  );
}

export default RankUser;
