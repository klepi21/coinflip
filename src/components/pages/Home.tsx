'use client'

import React from 'react';
import { ArrowRight, Code2, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export const Home = () => {
  return (
    <div className="relative isolate pt-14">
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-6xl">
              Build on MultiversX with Modern Tools
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-600 dark:text-stone-400">
              Start building decentralized applications with this production-ready template.
              Connect wallets, interact with smart contracts, and create amazing experiences.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/tutorial"
                className="inline-flex items-center rounded-xl bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                View Tutorial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  title: 'Secure by Default',
                  description: 'Built with security best practices and integrated with trusted MultiversX SDKs.',
                  icon: Shield,
                },
                {
                  title: 'Modern Stack',
                  description: 'Uses Next.js, TypeScript, and Tailwind CSS for a powerful development experience.',
                  icon: Zap,
                },
                {
                  title: 'Developer Ready',
                  description: 'Includes everything you need to start building your dApp immediately.',
                  icon: Code2,
                },
              ].map((feature) => (
                <Card key={feature.title} className="p-6">
                  <dt className="flex items-center gap-x-3 text-base font-semibold text-stone-900 dark:text-white">
                    <feature.icon className="h-5 w-5 flex-none text-primary" />
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base text-stone-600 dark:text-stone-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </Card>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};