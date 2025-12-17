import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-boxdark-2">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <Image
            className="w-32 h-32"
            src="/images/illustration/404.svg"
            alt="404"
            width={128}
            height={128}
          />
        </div>
        <h1 className="mb-3 text-[3.5rem] font-bold leading-none tracking-tight text-gray-900 lg:text-[4rem] xl:text-[5rem]">
          404
        </h1>
        <h2 className="mb-3 text-[26px] font-bold leading-normal text-gray-900 lg:text-[32px]">
          Oops! This page can&apos;t be found
        </h2>
        <p className="mb-8 text-lg text-gray-500">
          The page you are looking for does not exist. It might have been moved
          or deleted altogether.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
        >
          Back to Homepage
        </Link>
      </div>
      <div className="mt-8 text-center">
        <p className="text-gray-500">
          &copy; {new Date().getFullYear()} - Winston Academy CRM
        </p>
      </div>
    </div>
  );
}
