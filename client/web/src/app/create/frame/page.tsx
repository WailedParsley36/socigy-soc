"use client";

import { PostAPI } from "@/lib/api/PostHelper";
import protectRoute from "@/lib/protectRoute";
import { ContentType } from "@/lib/structures/content/posts/RecommendationRequest";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import { FormEvent, useCallback, useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableImageProps {
  id: string;
  src: string;
  index: number;
  onRemove: (id: string) => void;
}

function SortableImage({ id, src, index, onRemove }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square"
      {...attributes}
      {...listeners}
    >
      <div className="h-full w-full rounded-md overflow-hidden border border-gray-200">
        <img
          src={src}
          alt={`Preview ${index + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove image"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
        {index + 1}
      </div>
    </div>
  );
}

// Main component
export default function CreateFramePage() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  // States
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<
    { id: string; src: string; file: File }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const maxCharCount = 1000;
  const maxImages = 10;

  // Refs
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Callbacks
  const handleFrameSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(undefined);
      setIsSubmitting(true);

      try {
        if (
          selectedFiles.length === 0 ||
          selectedFiles.length > maxImages ||
          !contentRef.current?.value
        ) {
          setError(`Please select 1-${maxImages} images and add a caption`);
          setIsSubmitting(false);
          return;
        }

        const result = await PostAPI.uploadPost({
          contentType: ContentType.Frame,
          content: contentRef.current.value,
          files: selectedFiles,
        });

        if (result.error) {
          setError(result.error.message);
          setIsSubmitting(false);
          return;
        }

        router.replace("/");
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        setIsSubmitting(false);
      }
    },
    [selectedFiles, router]
  );

  const handleContentChange = useCallback(() => {
    if (contentRef.current) {
      setCharCount(contentRef.current.value.length);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);

        // Check if adding these files would exceed the limit
        if (selectedFiles.length + newFiles.length > maxImages) {
          setError(`You can only upload up to ${maxImages} images`);
          return;
        }

        // Process new files
        const newPreviewImages = [...previewImages];

        newFiles.forEach((file) => {
          const reader = new FileReader();
          const id = `image-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;

          reader.onload = (e) => {
            if (e.target?.result) {
              newPreviewImages.push({
                id,
                src: e.target.result as string,
                file,
              });
              setPreviewImages([...newPreviewImages]);
            }
          };
          reader.readAsDataURL(file);
        });

        setSelectedFiles([...selectedFiles, ...newFiles]);
        setError(undefined);
      }
    },
    [selectedFiles, previewImages, maxImages]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith("image/")
        );

        if (newFiles.length === 0) {
          setError("Please drop only image files");
          return;
        }

        // Check if adding these files would exceed the limit
        if (selectedFiles.length + newFiles.length > maxImages) {
          setError(`You can only upload up to ${maxImages} images`);
          return;
        }

        // Process new files
        const newPreviewImages = [...previewImages];

        newFiles.forEach((file) => {
          const reader = new FileReader();
          const id = `image-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;

          reader.onload = (e) => {
            if (e.target?.result) {
              newPreviewImages.push({
                id,
                src: e.target.result as string,
                file,
              });
              setPreviewImages([...newPreviewImages]);
            }
          };
          reader.readAsDataURL(file);
        });

        setSelectedFiles([...selectedFiles, ...newFiles]);
        setError(undefined);
      }
    },
    [selectedFiles, previewImages, maxImages]
  );

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (id: string) => {
    const imageIndex = previewImages.findIndex((img) => img.id === id);
    if (imageIndex === -1) return;

    const newPreviewImages = [...previewImages];
    const removedFile = newPreviewImages[imageIndex].file;
    newPreviewImages.splice(imageIndex, 1);

    const newSelectedFiles = selectedFiles.filter(
      (file) => file !== removedFile
    );

    setPreviewImages(newPreviewImages);
    setSelectedFiles(newSelectedFiles);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPreviewImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        setSelectedFiles(newOrder.map((item) => item.file));
        return newOrder;
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const redirectTo = protectRoute(auth);
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 flex items-center">
        <Link href="/create" className="mr-3 text-gray-500 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">Create a Frame</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <form onSubmit={handleFrameSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images
            </label>
            <div
              ref={dropAreaRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-500"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-1 text-sm text-gray-600">
                {isDragging
                  ? "Drop images here"
                  : "Click to upload images or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, GIF up to {maxImages} images
              </p>
            </div>

            {previewImages.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Images ({previewImages.length}/{maxImages})
                  </p>
                  <p className="text-xs text-gray-500">Drag to reorder</p>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={previewImages.map((img) => img.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {previewImages.map((image, index) => (
                        <SortableImage
                          key={image.id}
                          id={image.id}
                          src={image.src}
                          index={index}
                          onRemove={removeImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Caption
            </label>
            <textarea
              id="content"
              ref={contentRef}
              minLength={2}
              maxLength={maxCharCount}
              required
              placeholder="Write a caption for your images..."
              onChange={handleContentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            />
            <div className="mt-1 flex justify-end">
              <span
                className={`text-xs ${
                  charCount > maxCharCount * 0.9
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {charCount}/{maxCharCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p>Your frame will be visible to everyone</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/create"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || previewImages.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  "Post Frame"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Tips for great frames
        </h3>
        <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>Use high-quality images that are clear and well-composed</li>
          <li>Arrange your images in a logical order to tell a story</li>
          <li>Write a descriptive caption that adds context to your images</li>
          <li>Use hashtags in your caption to increase discoverability</li>
        </ul>
      </div>
    </div>
  );
}
