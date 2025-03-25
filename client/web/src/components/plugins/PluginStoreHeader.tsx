import Link from "next/link";

export default function PluginStoreHeader() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link className="mb-4" href={"/plugins/dev"}>
          Are you a developer?
        </Link>

        <h1 className="text-4xl font-bold mb-4 mt-4">Plugin Store</h1>
        <p className="text-xl opacity-90 max-w-2xl">
          Discover powerful plugins to enhance your experience and boost
          productivity
        </p>
      </div>
    </div>
  );
}
