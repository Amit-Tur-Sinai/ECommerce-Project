import { useState } from 'react';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { Cloud, Store, Shield } from 'lucide-react';

type UserRole = 'Business' | 'Insurance';

export const RegisterPage = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Business');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <Cloud className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Choose your account type to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-4 mb-6 px-4 sm:px-0">
          <button
            onClick={() => setSelectedRole('Business')}
            className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedRole === 'Business'
                ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Store className={`w-6 h-6 ${
              selectedRole === 'Business'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500'
            }`} />
            <div className="text-left">
              <div className={`font-semibold ${
                selectedRole === 'Business'
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                Business
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Store owner / Manager</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('Insurance')}
            className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedRole === 'Insurance'
                ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Shield className={`w-6 h-6 ${
              selectedRole === 'Insurance'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500'
            }`} />
            <div className="text-left">
              <div className={`font-semibold ${
                selectedRole === 'Insurance'
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                Insurance Agent
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Work at an insurance company</div>
            </div>
          </button>
        </div>

        {/* Register Form Card */}
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700 mx-4 sm:mx-0">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedRole === 'Business' ? 'Business Registration' : 'Insurance Agent Registration'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedRole === 'Business'
                ? 'Set up your business to get weather risk insights and recommendations'
                : 'Sign up as an employee of an insurance company to manage portfolios and risk assessments'}
            </p>
          </div>
          <RegisterForm role={selectedRole} />
        </div>
      </div>
    </div>
  );
};
