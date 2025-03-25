"use client";

export default function Playground() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <BasePlaygroundBody />
      </main>
    </div>
  );
}

function Header() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Plugin Playground
            </h1>
            <p className="text-lg opacity-90 mb-4">
              Here you can see the plugins in action!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BasePlaygroundBody() {
  return <p>It seems that no plugin is taking advantage of me 🥲</p>;
}
