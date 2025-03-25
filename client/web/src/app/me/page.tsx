"use client";

import { PostAPI } from "@/lib/api/PostHelper";
import { apiFetch } from "@/lib/apiClient";
import protectRoute from "@/lib/protectRoute";
import { RecommendedPost } from "@/lib/structures/content/posts/RecommendedPost";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Plugins() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  const [error, setError] = useState<string>();
  const [myPosts, setMyPosts] = useState<RecommendedPost[]>([]);

  useEffect(() => {
    async function query() {
      const posts = await PostAPI.queryPosts({
        targetUserId: auth.user!.id,
        limit: 50,
        offset: 0,
      });
      if (posts.error) {
        setError(posts.error.message);
        return;
      }

      const uniqueUsers = posts.result!.filter(
        (post, index, self) => index === self.findIndex((p) => p.id === post.id)
      );
      setMyPosts(uniqueUsers);
    }

    if (!isLoaded) return;

    query();
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }

  const redirectTo = protectRoute(auth);
  if (redirectTo) return redirect(redirectTo);

  return (
    <div>
      <h1>My Posts</h1>
      <ul>
        {myPosts.length > 0 ? (
          myPosts.map((x) => <li key={x.id}>{JSON.stringify(x)}</li>)
        ) : (
          <p>You have not posted anything</p>
        )}
      </ul>
    </div>
  );
}
