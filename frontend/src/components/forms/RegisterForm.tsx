import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { STORE_TYPES, STORE_TYPE_LABELS } from '@/utils/constants';
import { RegisterData } from '@/services/auth';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  store_type: z.enum([STORE_TYPES.BUTCHER_SHOP, STORE_TYPES.WINERY]),
  city: z.string().min(2, 'City name must be at least 2 characters'),
  industry: z.string().optional(),
  size: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      store_type: STORE_TYPES.BUTCHER_SHOP,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data as RegisterData);
      navigate('/dashboard');
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="At least 8 characters"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Business Name
        </label>
        <input
          {...register('business_name')}
          type="text"
          id="business_name"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Your Business Name"
        />
        {errors.business_name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.business_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="store_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Store Type
        </label>
        <select
          {...register('store_type')}
          id="store_type"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {Object.entries(STORE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.store_type && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.store_type.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          City Location
        </label>
        <input
          {...register('city')}
          type="text"
          id="city"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="City Name"
        />
        {errors.city && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Industry (Optional)
        </label>
        <input
          {...register('industry')}
          type="text"
          id="industry"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="e.g., Food & Beverage"
        />
      </div>

      <div>
        <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Business Size (Optional)
        </label>
        <select
          {...register('size')}
          id="size"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select size</option>
          <option value="small">Small (1-10 employees)</option>
          <option value="medium">Medium (11-50 employees)</option>
          <option value="large">Large (50+ employees)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-600 dark:bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};
