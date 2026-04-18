"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // Only fetch if we have a logged-in user
    if (session?.user?.email) {
      // Reconstruct the username the same way we did in the Arena
      const emailPrefix = session.user.email.split('@')[0];
      const username = session.user.name?.replace(/\s+/g, '') || emailPrefix;

      fetch(`http://localhost:8000/profile/${username}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            setProfileData(data);
          }
        })
        .catch(err => console.error("Failed to fetch profile:", err));
    }
  }, [session]);

  if (!profileData) return <div>Loading Profile...</div>;

  return (
    <div>
      {/* User Stats */}
      <h2>{profileData.user.username}</h2>
      <p>Rank: {profileData.user.elo} Elo</p>

      {/* Match History */}
      <h3>Recent Battles</h3>
      <ul>
        {profileData.history.map((match, index) => (
          <li key={index}>
            VS {match.opponent} | {match.result} | {match.elo_change}
          </li>
        ))}
      </ul>
    </div>
  );
}
