import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInSchema, type SignInInput } from '@app/shared/schemas';
import { signIn } from '@/lib/auth-client';

export function SignInPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignInInput>({
    login: '',
    password: '',
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

    const result = signInSchema.safeParse(formData);
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
      // Detect if login is email (contains @) or username
      const isEmail = formData.login.includes('@');

      const { error } = isEmail
        ? await signIn.email({
            email: formData.login,
            password: formData.password,
          })
        : await signIn.username({
            username: formData.login,
            password: formData.password,
          });

      if (error) {
        setErrors({ form: error.message || 'Invalid credentials' });
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-3">
            Welcome back
          </h1>
          <p className="text-stone text-lg">
            Sign in to continue to your account
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
            {/* Login (Username or Email) */}
            <div className="form-group">
              <label htmlFor="login" className="auth-label">
                Username or Email
              </label>
              <input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                required
                value={formData.login}
                onChange={handleChange}
                placeholder="janesmith or jane@example.com"
                className={`auth-input ${errors.login ? 'has-error' : ''}`}
                data-testid="signin-login"
              />
              {errors.login && (
                <p className="error-message">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.login}
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
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                className={`auth-input ${errors.password ? 'has-error' : ''}`}
                data-testid="signin-password"
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
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.2s backwards' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-button"
              data-testid="signin-submit"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="spinner" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </span>
            </button>
          </div>

          {/* Footer Link */}
          <p
            className="text-center text-stone"
            style={{ animation: 'fadeUp 0.5s ease-out 0.25s backwards' }}
          >
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="auth-link">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
