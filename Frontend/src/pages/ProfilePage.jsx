import ProfileDashboard from '../components/profile/ProfileDashboard';

export default function ProfilePage() {
  return (
    <main className="min-h-screen pt-24 sm:pt-28 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <ProfileDashboard />
      </div>
    </main>
  );
}
