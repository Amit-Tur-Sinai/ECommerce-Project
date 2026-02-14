import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Building2, Filter, Plus, FileText, AlertTriangle, Search } from 'lucide-react';
import { insuranceService, BusinessPortfolioItem, BusinessNote } from '@/services/insurance';
import { formatDateTime } from '@/utils/formatters';

export const PortfolioPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessPortfolioItem[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessPortfolioItem[]>([]);
  
  // Filters
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [storeTypeFilter, setStoreTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, riskLevelFilter, storeTypeFilter, searchQuery]);

  const loadPortfolio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await insuranceService.getPortfolio();
      setBusinesses(data.businesses);
      setFilteredBusinesses(data.businesses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business portfolio');
      console.error('Error loading portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...businesses];

    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter((b) => b.risk_level === riskLevelFilter);
    }

    if (storeTypeFilter !== 'all') {
      filtered = filtered.filter((b) => b.store_type === storeTypeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.business_name.toLowerCase().includes(query) ||
          b.city.toLowerCase().includes(query)
      );
    }

    setFilteredBusinesses(filtered);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleAddNote = async () => {
    if (!selectedBusiness || !newNote.trim()) return;

    try {
      await insuranceService.createNote(selectedBusiness, newNote);
      const notesData = await insuranceService.getBusinessNotes(selectedBusiness);
      setNotes(notesData.notes);
      setNewNote('');
      await loadPortfolio(); // Refresh to update notes count
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const loadBusinessNotes = async (businessId: number) => {
    try {
      const notesData = await insuranceService.getBusinessNotes(businessId);
      setNotes(notesData.notes);
      setSelectedBusiness(businessId);
      setShowNoteModal(true);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Portfolio</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and monitor your insured businesses. Filter by risk level, add notes, and track compliance.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Business name or city..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Level</label>
            <select
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Type</label>
            <select
              value={storeTypeFilter}
              onChange={(e) => setStoreTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="butcher_shop">Butcher Shop</option>
              <option value="winery">Winery</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setRiskLevelFilter('all');
                setStoreTypeFilter('all');
                setSearchQuery('');
              }}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Businesses</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredBusinesses.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low Risk</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {filteredBusinesses.filter((b) => b.risk_level === 'Low').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">High Risk</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {filteredBusinesses.filter((b) => b.risk_level === 'High' || b.risk_level === 'Critical').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Compliance</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredBusinesses.length > 0
              ? (
                  filteredBusinesses.reduce((sum, b) => sum + b.compliance_score, 0) /
                  filteredBusinesses.length
                ).toFixed(1)
              : '0.0'}
            %
          </div>
        </div>
      </div>

      {/* Business List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Insured Businesses</h2>
        </div>
        <div className="p-6">
          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No businesses found matching your filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBusinesses.map((business) => (
                <div
                  key={business.business_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {business.business_name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(business.risk_level)}`}>
                          {business.risk_level} Risk
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                          {business.store_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>📍 {business.city}</span>
                        <span>📊 {business.compliance_score.toFixed(1)}% ({business.rank_level})</span>
                        <span>📝 {business.notes_count} notes</span>
                        <span>📋 {business.claims_count} claims</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadBusinessNotes(business.business_id)}
                        className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Notes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {showNoteModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Business Notes</h2>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setSelectedBusiness(null);
                  setNotes([]);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this business..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                className="mt-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Add Note
              </button>
            </div>

            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.note_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{note.created_by_email}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(new Date(note.created_at))}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await insuranceService.deleteNote(note.note_id);
                            const notesData = await insuranceService.getBusinessNotes(selectedBusiness!);
                            setNotes(notesData.notes);
                            await loadPortfolio();
                          } catch (err) {
                            console.error('Error deleting note:', err);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Delete note"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{note.note_text}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">No notes yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
