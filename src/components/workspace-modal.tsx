'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface WorkspaceModalProps {
  userId: string;
}

export default function WorkspaceModal({ userId }: WorkspaceModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const findUniqueSlug = async (baseSlug: string): Promise<string> => {
    const supabase = createClient();
    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found - slug is available
        return slug;
      }

      if (data) {
        // Slug exists, try with counter
        slug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        return slug;
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const baseSlug = generateSlug(brandName);

      if (!baseSlug) {
        setError('Please enter a valid workspace name');
        setLoading(false);
        return;
      }

      const uniqueSlug = await findUniqueSlug(baseSlug);

      const { error: insertError } = await supabase.from('workspaces').insert({
        slug: uniqueSlug,
        brand_name: brandName,
        owner_id: userId,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setBrandName('');
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-medium transition-colors"
      >
        New Workspace
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsOpen(false)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Create New Workspace
                      </h3>

                      {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                          {error}
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="brandName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Workspace Name
                        </label>
                        <input
                          id="brandName"
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="My CRM"
                        />
                        {brandName && (
                          <p className="mt-2 text-sm text-gray-500">
                            URL: /{generateSlug(brandName)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Workspace'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
