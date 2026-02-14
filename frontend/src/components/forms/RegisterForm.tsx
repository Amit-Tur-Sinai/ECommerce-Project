import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { STORE_TYPES, STORE_TYPE_LABELS } from '@/utils/constants';
import { RegisterData } from '@/services/auth';
import { api } from '@/services/api';

// Schema for Business registration
const businessRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  store_type: z.enum([STORE_TYPES.BUTCHER_SHOP, STORE_TYPES.WINERY]),
  city: z.string().min(2, 'Please select a city'),
  industry: z.string().optional(),
  size: z.string().optional(),
  insurance_company_id: z.number().optional(),
  consent_share_data: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to share data with the insurance company' }),
  }),
});

// Schema for Insurance registration
const insuranceRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  insurance_company_id: z.number({ required_error: 'Please select an insurance company' }),
});

type BusinessFormData = z.infer<typeof businessRegisterSchema>;
type InsuranceFormData = z.infer<typeof insuranceRegisterSchema>;

interface InsuranceCompany {
  id: number;
  name: string;
}

interface RegisterFormProps {
  role: 'Business' | 'Insurance';
}

export const RegisterForm = ({ role }: RegisterFormProps) => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [cities, setCities] = useState<string[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<InsuranceCompany[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // Business form
  const businessForm = useForm<BusinessFormData>({
    resolver: zodResolver(businessRegisterSchema),
    defaultValues: {
      store_type: STORE_TYPES.BUTCHER_SHOP,
    },
  });

  // Insurance form
  const insuranceForm = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceRegisterSchema),
  });

  useEffect(() => {
    // Fetch insurance companies (needed for both roles)
    api.get('/auth/insurance-companies').then((res) => {
      setInsuranceCompanies(res.data);
      // Auto-select first company as default
      if (res.data.length > 0) {
        businessForm.setValue('insurance_company_id', res.data[0].id);
        insuranceForm.setValue('insurance_company_id', res.data[0].id);
      }
    }).catch(() => {});

    // Fetch cities only for business role
    if (role === 'Business') {
      api.get('/auth/cities').then((res) => setCities(res.data)).catch(() => {});
    }
  }, [role, businessForm.setValue, insuranceForm.setValue]);

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as HTMLElement)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter cities based on typed prefix
  const filteredCities = cityQuery
    ? cities.filter((c) => c.toLowerCase().startsWith(cityQuery.toLowerCase()))
    : cities;

  const onBusinessSubmit = async (data: BusinessFormData) => {
    try {
      const { consent_share_data, ...rest } = data;
      const registerData: RegisterData = { ...rest, role: 'Business' };
      await registerUser(registerData);
      navigate('/dashboard');
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  const onInsuranceSubmit = async (data: InsuranceFormData) => {
    try {
      const registerData: RegisterData = { ...data, role: 'Insurance' };
      await registerUser(registerData);
      navigate('/admin');
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const errorClass = "mt-1 text-sm text-red-600 dark:text-red-400";

  // ========================
  // Insurance Registration
  // ========================
  if (role === 'Insurance') {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = insuranceForm;

    return (
      <form onSubmit={handleSubmit(onInsuranceSubmit)} className="space-y-6">
        <div>
          <label htmlFor="ins_email" className={labelClass}>Email</label>
          <input
            {...register('email')}
            type="email"
            id="ins_email"
            className={inputClass}
            placeholder="your@email.com"
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="ins_password" className={labelClass}>Password</label>
          <input
            {...register('password')}
            type="password"
            id="ins_password"
            className={inputClass}
            placeholder="At least 8 characters"
          />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="ins_company" className={labelClass}>Insurance Company</label>
          <select
            {...register('insurance_company_id', { valueAsNumber: true })}
            id="ins_company"
            className={inputClass}
          >
            {insuranceCompanies.length === 0 ? (
              <option value="">Loading...</option>
            ) : (
              insuranceCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))
            )}
          </select>
          {errors.insurance_company_id && <p className={errorClass}>{errors.insurance_company_id.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 dark:bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            Sign in
          </Link>
        </p>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          Are you an insurance company and want to partner with us?{' '}
          <a href="mailto:contact@canopy.com" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            Email us
          </a>
        </p>
      </form>
    );
  }

  // ========================
  // Business Registration
  // ========================
  const { register, handleSubmit, formState: { errors, isSubmitting } } = businessForm;

  return (
    <form onSubmit={handleSubmit(onBusinessSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className={inputClass}
          placeholder="your@email.com"
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className={inputClass}
          placeholder="At least 8 characters"
        />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="business_name" className={labelClass}>Business Name</label>
        <input
          {...register('business_name')}
          type="text"
          id="business_name"
          className={inputClass}
          placeholder="Your Business Name"
        />
        {errors.business_name && <p className={errorClass}>{errors.business_name.message}</p>}
      </div>

      <div>
        <label htmlFor="store_type" className={labelClass}>Store Type</label>
        <select
          {...register('store_type')}
          id="store_type"
          className={inputClass}
        >
          {Object.entries(STORE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.store_type && <p className={errorClass}>{errors.store_type.message}</p>}
      </div>

      {/* City searchable dropdown */}
      <div ref={cityRef} className="relative">
        <label htmlFor="city_search" className={labelClass}>City Location</label>
        <input
          type="text"
          id="city_search"
          value={cityQuery}
          onChange={(e) => {
            const val = e.target.value;
            setCityQuery(val);
            setShowCityDropdown(true);
            // Clear the form value when user starts typing again
            if (!cities.includes(val)) {
              businessForm.setValue('city', '', { shouldValidate: false });
            }
          }}
          onFocus={() => setShowCityDropdown(true)}
          className={inputClass}
          placeholder="Type to search cities..."
          autoComplete="off"
        />
        {/* Hidden input to keep react-hook-form in sync */}
        <input type="hidden" {...register('city')} />

        {showCityDropdown && filteredCities.length > 0 && (
          <div className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
            {filteredCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  businessForm.setValue('city', city, { shouldValidate: true });
                  setCityQuery(city);
                  setShowCityDropdown(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        )}
        {showCityDropdown && cityQuery.length >= 1 && filteredCities.length === 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm text-gray-500 dark:text-gray-400">
            No cities found matching "{cityQuery}"
          </div>
        )}
        {errors.city && <p className={errorClass}>{errors.city.message}</p>}
      </div>

      <div>
        <label htmlFor="industry" className={labelClass}>Industry (Optional)</label>
        <input
          {...register('industry')}
          type="text"
          id="industry"
          className={inputClass}
          placeholder="e.g., Food & Beverage"
        />
      </div>

      <div>
        <label htmlFor="size" className={labelClass}>Business Size (Optional)</label>
        <select
          {...register('size')}
          id="size"
          className={inputClass}
        >
          <option value="">Select size</option>
          <option value="small">Small (1-10 employees)</option>
          <option value="medium">Medium (11-50 employees)</option>
          <option value="large">Large (50+ employees)</option>
        </select>
      </div>

      {/* Insurance Company Selection */}
      <div>
        <label htmlFor="insurance_company_id" className={labelClass}>Insurance Company</label>
        <select
          {...register('insurance_company_id', { valueAsNumber: true })}
          id="insurance_company_id"
          className={inputClass}
        >
          {insuranceCompanies.length === 0 ? (
            <option value="">Loading...</option>
          ) : (
            insuranceCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Consent Checkbox */}
      <div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            {...register('consent_share_data')}
            className="w-4 h-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            I agree to share my business data with the selected insurance company for risk assessment and policy management purposes.
          </span>
        </label>
        {errors.consent_share_data && (
          <p className={errorClass}>{errors.consent_share_data.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-600 dark:bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
};
