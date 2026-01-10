import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpSchema, type SignUpInput } from '@app/shared/schemas';
import { signUp } from '@/lib/auth-client';

export function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpInput>({
    email: '',
    password: '',
    username: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp.email({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        displayUsername: formData.username,
        name: formData.fullName,
        fullName: formData.fullName,
      });

      if (error) {
        setErrors({ form: error.message || 'Sign up failed' });
        return;
      }

      navigate('/dashboard');
    } catch {
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12" style={{ animation: 'fadeUp 0.6s ease-out' }}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-forest mb-6">
            <svg className="w-6 h-6 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-3">
            Create account
          </h1>
          <p className="text-stone text-lg">
            Join us and start your journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {errors.form && (
            <div className="error-banner">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{errors.form}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName" className="auth-label">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Jane Smith"
                className={`auth-input ${errors.fullName ? 'has-error' : ''}`}
                data-testid="signup-fullname"
              />
              {errors.fullName && (
                <p className="error-message">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="form-group">
              <label htmlFor="username" className="auth-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="janesmith"
                className={`auth-input ${errors.username ? 'has-error' : ''}`}
                data-testid="signup-username"
              />
              {errors.username && (
                <p className="error-message">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="auth-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className={`auth-input ${errors.email ? 'has-error' : ''}`}
                data-testid="signup-email"
              />
              {errors.email && (
                <p className="error-message">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className={`auth-input ${errors.password ? 'has-error' : ''}`}
                data-testid="signup-password"
              />
              {errors.password && (
                <p className="error-message">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.3s backwards' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-button"
              data-testid="signup-submit"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="spinner" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </span>
            </button>
          </div>

          {/* Footer Link */}
          <p
            className="text-center text-stone"
            style={{ animation: 'fadeUp 0.5s ease-out 0.35s backwards' }}
          >
            Already have an account?{' '}
            <Link to="/signin" className="auth-link">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
