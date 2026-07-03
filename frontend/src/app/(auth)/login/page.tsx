'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLoginMutation } from '@/hooks/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
      remember: data.remember,
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.9)), url("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80")',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl border border-gray-200 bg-white/95 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-wide text-gray-900">LOGIN IN</h1>
            <p className="mt-1 text-sm text-gray-500">File Management System</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Enter email"
                  className="flex h-11 w-full rounded-lg border border-gray-200 bg-blue-50/50 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  className="flex h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" {...register('remember')} className="rounded border-gray-300" />
              Remember login
            </label>

            <Button type="submit" className="w-full" size="lg" loading={loginMutation.isPending}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Demo: demo@gmail.com / Demo@123
          </p>
        </div>
      </div>
    </div>
  );
}
