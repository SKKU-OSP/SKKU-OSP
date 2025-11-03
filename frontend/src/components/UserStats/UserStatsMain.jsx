import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserStatsMain.css';

const UserStatsMain = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/userstats');
        if (!response.ok) {
          throw new Error('Something went wrong!');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setError(error.message);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    // Bonus: URL change when user is selected
    // navigate(`/userstats/${user.username}`);
  };

  return (
    <div className="user-stats-container">
      <div className="user-list-section">
        <h2>User List</h2>
        {/* Search and Sort controls will go here */}
        <div className="user-list">
          {isLoading && <p>Loading users...</p>}
          {error && <p>{error}</p>}
          {!isLoading &&
            !error &&
            users.map((user) => (
              <div
                key={user.id}
                className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => handleUserClick(user)}
              >
                <div className="user-card-info">
                  <span className="user-name">{user.username}</span>
                  <span className="user-github">@{user.github_id}</span>
                </div>
                {/* Student ID and Score will go here */}
              </div>
            ))}
        </div>
      </div>
      <div className="user-details-section">
        {selectedUser ? (
          <div>
            <h2>{selectedUser.username}'s Statistics</h2>
            {/* Detailed stats will go here */}
          </div>
        ) : (
          <div className="placeholder">
            <p>Select a user to see their statistics.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStatsMain;
