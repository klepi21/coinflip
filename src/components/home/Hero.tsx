import React from 'react';
import { ArrowRight, Code2, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export const Hero = ({ }) => {
  return (
    <div className="relative isolate pt-14">
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-6xl">
              Build on MultiversX with Modern Tools
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-600">
              Start building decentralized applications with this production-ready template.
              Connect wallets, interact with smart contracts, and create amazing experiences.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">

            </div>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-stone-900">
                  <Shield className="h-5 w-5 flex-none text-stone-600" />
                  Secure by Default
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-stone-600">
                  <p className="flex-auto">
                    Built with security best practices and integrated with trusted MultiversX SDKs.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-stone-900">
                  <Zap className="h-5 w-5 flex-none text-stone-600" />
                  Modern Stack
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-stone-600">
                  <p className="flex-auto">
                    Uses React, TypeScript, Vite, and Tailwind CSS for a powerful development experience.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-stone-900">
                  <Code2 className="h-5 w-5 flex-none text-stone-600" />
                  Developer Ready
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-stone-600">
                  <p className="flex-auto">
                    Includes everything you need to start building your dApp immediately.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};