import { Outlet } from 'react-router-dom';

export default function AccountsLayout() {
  return (
    <div className="container d-flex justify-content-center my-5">
      <div className="col-lg-6 col-12">
        <Outlet />
      </div>
    </div>
  );
}
