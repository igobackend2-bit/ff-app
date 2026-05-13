'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Phone, MapPin, Edit2, Shield, Bell,
  CreditCard, LogOut, ChevronRight, Check, X, Loader2,
} from 'lucide-react';
import { BackButton } from '@/components/common/BackButton';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile } = useUserStore();
  const [hydrated, setHydrated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Wait for Zustand to finish hydrating from localStorage
  useEffect(() => {
    if (useUserStore.persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    } else {
      const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (user?.name) setNewName(user.name);
  }, [user]);

  // Redirect only after hydration confirms no user
  useEffect(() => {
    if (hydrated && !user) router.replace('/login?callbackUrl=/account/profile');
  }, [hydrated, user, router]);

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user?.name) { setIsEditing(false); return; }
    setIsUpdating(true);
    try { await updateProfile({ name: newName.trim() }); setIsEditing(false); }
    catch (e) { console.error(e); }
    finally { setIsUpdating(false); }
  };

  const handleLogout = async () => { logout(); router.push('/'); };

  if (!hydrated || !user) return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 animate-pulse">
      <div className="h-8 w-24 rounded-xl bg-neutral-100 mb-6" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 h-96 rounded-3xl bg-neutral-100" />
        <div className="lg:col-span-8 space-y-6">
          <div className="h-64 rounded-3xl bg-neutral-100" />
          <div className="h-32 rounded-3xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );

  const phone = user.phone ?? '';
  const initial = user.name?.charAt(0) || phone.charAt(phone.length - 1) || 'U';

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 lg:py-12">
      <div className="mb-6">
        <BackButton />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }} className="lg:col-span-4"
        >
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="relative h-32 bg-gradient-to-br from-primary-600 to-primary-700" />
            <div className="absolute left-6" style={{ marginTop: '-3rem' }}>
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-primary-50 shadow-md flex items-center justify-center text-3xl font-bold text-primary-600">
                {initial}
                <button className="absolute bottom-1 right-1 rounded-full bg-white p-1.5 shadow-sm hover:bg-neutral-50">
                  <Edit2 className="h-3 w-3 text-neutral-600" />
                </button>
              </div>
            </div>
            <div className="px-6 pb-8 pt-16">
              <h2 className="text-xl font-bold text-neutral-900">{user.name || 'Set your name'}</h2>
              <p className="text-sm text-neutral-500">Farmers Factory Member</p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-2xl font-bold text-primary-600">0</p>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Orders</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-2xl font-bold text-amber-500">0</p>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Rewards</p>
                </div>
              </div>
              <div className="mt-8 space-y-2">
                <button 
                  onClick={() => router.push('/account')}
                  className="flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <span className="flex items-center gap-3"><User className="h-4 w-4" /> Dashboard</span>
                  <ChevronRight className="h-4 w-4 opacity-40" />
                </button>
                <button className="flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium text-primary-600 bg-primary-50">
                  <span className="flex items-center gap-3"><Edit2 className="h-4 w-4" /> Profile Details</span>
                  <ChevronRight className="h-4 w-4 opacity-40" />
                </button>
                <button className="flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                  <span className="flex items-center gap-3"><Bell className="h-4 w-4" /> Notifications</span>
                  <ChevronRight className="h-4 w-4 opacity-40" />
                </button>
                <button className="flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                  <span className="flex items-center gap-3"><CreditCard className="h-4 w-4" /> Payments</span>
                  <ChevronRight className="h-4 w-4 opacity-40" />
                </button>
                <button onClick={handleLogout} className="flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium text-red-600 hover:bg-red-50 text-left">
                  <span className="flex items-center gap-3"><LogOut className="h-4 w-4" /> Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-8"
        >
          <div className="space-y-6">
            {/* Personal Info */}
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Personal Information</h3>
                    <p className="text-sm text-neutral-500">Update your basic profile details</p>
                  </div>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-95">
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="rounded-xl border border-neutral-200 p-2 hover:bg-neutral-50">
                      <X className="h-4 w-4" />
                    </button>
                    <button onClick={handleUpdateName} disabled={isUpdating} className="rounded-xl bg-primary-600 p-2 text-white hover:bg-primary-700 disabled:opacity-50">
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  {isEditing ? (
                    <>
                      <label htmlFor="profile-name" className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Full Name</label>
                      <input id="profile-name" value={newName} onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                        placeholder="Enter your name" />
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Full Name</p>
                      <p className="font-medium text-neutral-900">{user.name || 'Not set'}</p>
                    </>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Email Address</p>
                  <p className="flex items-center gap-2 font-medium text-neutral-900">
                    <Mail className="h-4 w-4 text-neutral-300" />{user.email || 'Not verified'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Phone Number</p>
                  <p className="flex items-center gap-2 font-medium text-neutral-900">
                    <Phone className="h-4 w-4 text-neutral-300" />{phone || '—'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Default Address</p>
                  <p className="flex items-center gap-2 font-medium text-neutral-900">
                    <MapPin className="h-4 w-4 text-neutral-300" />Not set
                  </p>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Account Security</h3>
                  <p className="text-sm text-neutral-500">Manage your security settings</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-neutral-900">Two-Factor Authentication</p>
                    <p className="text-xs text-neutral-500">Protected by your mobile phone</p>
                  </div>
                </div>
                <button className="text-sm font-bold text-primary-600 hover:underline">Configure</button>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
