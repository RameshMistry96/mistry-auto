import { useEffect, useState } from 'react';
import './Admin.css';

function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem('mistryAdminToken')
  );

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);

  // ================= SERVICES & PRICING =================

const [services, setServices] = useState([]);
const [servicesLoading, setServicesLoading] = useState(false);
const [servicesMessage, setServicesMessage] = useState('');

const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
const [editingService, setEditingService] = useState(null);

const [serviceForm, setServiceForm] = useState({
  name: '',
  description: '',
  price: '',
  image: '',
  active: true
});

const [savingService, setSavingService] = useState(false);
const [deletingServiceId, setDeletingServiceId] = useState(null);

  // ================= BLOCK DATES =================

const [blockedDates, setBlockedDates] = useState([]);
const [blockDate, setBlockDate] = useState('');
const [blockReason, setBlockReason] = useState('Fully Booked');
const [blockingDate, setBlockingDate] = useState(false);
const [blockDateMessage, setBlockDateMessage] = useState('');

  // Search + Filter + Sort + View
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [appointmentView, setAppointmentView] = useState('ACTIVE');
  // ================= ADMIN NAVIGATION =================
const [adminSection, setAdminSection] = useState('dashboard');
  

  // ================= ADMIN LOGIN =================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed.');
      }

      sessionStorage.setItem('mistryAdminToken', data.token);

      setPassword('');
      setIsLoggedIn(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD APPOINTMENTS =================

  const loadAppointments = async () => {
    const token = sessionStorage.getItem('mistryAdminToken');

    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    setAppointmentsLoading(true);
    setDashboardError('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/appointments',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem('mistryAdminToken');
        setIsLoggedIn(false);
        throw new Error('Your admin session has expired.');
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load appointments.'
        );
      }

      setAppointments(data.appointments || []);
    } catch (error) {
      setDashboardError(error.message);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // ================= LOAD SERVICES =================

const loadServices = async () => {
  const token = sessionStorage.getItem('mistryAdminToken');

  if (!token) {
    setIsLoggedIn(false);
    return;
  }

  setServicesLoading(true);
  setServicesMessage('');

  try {
    const response = await fetch(
      'http://localhost:5000/api/admin/services',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem('mistryAdminToken');
      setIsLoggedIn(false);
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || 'Unable to load services.'
      );
    }

    setServices(data.services || []);

  } catch (error) {
    setServicesMessage(error.message);
  } finally {
    setServicesLoading(false);
  }
};

  // ================= LOAD AFTER LOGIN =================

  useEffect(() => {
    if (isLoggedIn) {
      loadAppointments();
      loadBlockedDates();
      loadServices();
    }
  }, [isLoggedIn]);

  // ================= LOAD BLOCKED DATES =================

const loadBlockedDates = async () => {
  const token = sessionStorage.getItem('mistryAdminToken');

  if (!token) {
    return;
  }

  try {
    const response = await fetch(
      'http://localhost:5000/api/admin/blocked-dates',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      setBlockedDates(data.blockedDates || []);
    }
  } catch (error) {
    console.error('Unable to load blocked dates:', error);
  }
};

  // ================= UPDATE STATUS =================

  const updateStatus = async (appointmentId, newStatus) => {
    const token = sessionStorage.getItem('mistryAdminToken');

    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    setUpdatingId(appointmentId);
    setDashboardError('');

    try {
      const response = await fetch(
        `http://localhost:5000/api/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem('mistryAdminToken');
        setIsLoggedIn(false);
        throw new Error('Your admin session has expired.');
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to update appointment.'
        );
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                status: newStatus
              }
            : appointment
        )
      );
    } catch (error) {
      setDashboardError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // ================= ARCHIVE / RESTORE =================

  const updateArchive = async (appointmentId, shouldArchive) => {
    const token = sessionStorage.getItem('mistryAdminToken');

    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    setArchivingId(appointmentId);
    setDashboardError('');

    try {
      const response = await fetch(
        `http://localhost:5000/api/appointments/${appointmentId}/archive`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            archived: shouldArchive
          })
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem('mistryAdminToken');
        setIsLoggedIn(false);
        throw new Error('Your admin session has expired.');
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to update appointment archive.'
        );
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                archived: shouldArchive ? 1 : 0
              }
            : appointment
        )
      );
    } catch (error) {
      setDashboardError(error.message);
    } finally {
      setArchivingId(null);
    }
  };

  // ================= BLOCK DATE =================

const handleBlockDate = async () => {
  if (!blockDate) {
    setBlockDateMessage('Please select a date.');
    return;
  }

  const token = sessionStorage.getItem('mistryAdminToken');

  setBlockingDate(true);
  setBlockDateMessage('');

  try {
    const response = await fetch(
      'http://localhost:5000/api/admin/blocked-dates',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          blockedDate: blockDate,
          reason: blockReason
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to block date.');
    }

    setBlockDateMessage('Date blocked successfully.');
    setBlockDate('');
    setBlockReason('Fully Booked');

    await loadBlockedDates();
  } catch (error) {
    setBlockDateMessage(error.message);
  } finally {
    setBlockingDate(false);
  }
};


// ================= UNBLOCK DATE =================

const handleUnblockDate = async (id) => {
  const token = sessionStorage.getItem('mistryAdminToken');

  try {
    const response = await fetch(
      `http://localhost:5000/api/admin/blocked-dates/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to unblock date.');
    }

    setBlockDateMessage('Date is available again.');

    await loadBlockedDates();
  } catch (error) {
    setBlockDateMessage(error.message);
  }
};

// ================= SERVICE EDITOR =================

const openAddService = () => {
  setEditingService(null);

  setServiceForm({
    name: '',
    description: '',
    price: '',
    image: '',
    active: true
  });

  setServicesMessage('');
  setServiceEditorOpen(true);
};


const openEditService = (service) => {
  setEditingService(service);

  setServiceForm({
    name: service.name || '',
    description: service.description || '',
    price: service.price || '',
    image: service.image || '',
    active: Number(service.active) === 1
  });

  setServicesMessage('');
  setServiceEditorOpen(true);
};


const closeServiceEditor = () => {
  if (savingService) {
    return;
  }

  setServiceEditorOpen(false);
  setEditingService(null);

  setServiceForm({
    name: '',
    description: '',
    price: '',
    image: '',
    active: true
  });
};


const handleServiceFormChange = (e) => {
  const { name, value, type, checked } = e.target;

  setServiceForm((current) => ({
    ...current,
    [name]: type === 'checkbox' ? checked : value
  }));
};

// ================= SAVE SERVICE =================

const handleSaveService = async () => {
  if (!serviceForm.name.trim()) {
    setServicesMessage('Please enter a service name.');
    return;
  }

  const token = sessionStorage.getItem('mistryAdminToken');

  if (!token) {
    setIsLoggedIn(false);
    return;
  }

  setSavingService(true);
  setServicesMessage('');

  try {
    const isEditing = !!editingService;

    const url = isEditing
      ? `http://localhost:5000/api/admin/services/${editingService.id}`
      : 'http://localhost:5000/api/admin/services';

    const response = await fetch(url, {
      method: isEditing ? 'PATCH' : 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify({
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        price: serviceForm.price.trim(),
        image: serviceForm.image.trim(),
        active: serviceForm.active
      })
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem('mistryAdminToken');
      setIsLoggedIn(false);
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || 'Unable to save service.'
      );
    }

    setServiceEditorOpen(false);
    setEditingService(null);

    setServiceForm({
      name: '',
      description: '',
      price: '',
      image: '',
      active: true
    });

    await loadServices();

    setServicesMessage(
      isEditing
        ? 'Service updated successfully.'
        : 'New service added successfully.'
    );

  } catch (error) {
    setServicesMessage(error.message);

  } finally {
    setSavingService(false);
  }
};

// ================= TOGGLE SERVICE VISIBILITY =================

const handleToggleService = async (service) => {
  const token = sessionStorage.getItem('mistryAdminToken');

  if (!token) {
    setIsLoggedIn(false);
    return;
  }

  setServicesMessage('');

  try {
    const newActiveStatus =
      Number(service.active) === 1 ? false : true;

    const response = await fetch(
      `http://localhost:5000/api/admin/services/${service.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: service.name,
          description: service.description || '',
          price: service.price || '',
          active: newActiveStatus
        })
      }
    );

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem('mistryAdminToken');
      setIsLoggedIn(false);
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || 'Unable to update service.'
      );
    }

    await loadServices();

    setServicesMessage(
      newActiveStatus
        ? 'Service is now visible on the website.'
        : 'Service is now hidden from the website.'
    );

  } catch (error) {
    setServicesMessage(error.message);
  }
};


// ================= DELETE SERVICE =================

const handleDeleteService = async (service) => {
  const confirmed = window.confirm(
    `Delete "${service.name}"?\n\nThis service will be permanently removed.`
  );

  if (!confirmed) {
    return;
  }

  const token = sessionStorage.getItem('mistryAdminToken');

  if (!token) {
    setIsLoggedIn(false);
    return;
  }

  setDeletingServiceId(service.id);
  setServicesMessage('');

  try {
    const response = await fetch(
      `http://localhost:5000/api/admin/services/${service.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem('mistryAdminToken');
      setIsLoggedIn(false);
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || 'Unable to delete service.'
      );
    }

    await loadServices();

    setServicesMessage(
      `"${service.name}" deleted successfully.`
    );

  } catch (error) {
    setServicesMessage(error.message);

  } finally {
    setDeletingServiceId(null);
  }
};

  // ================= LOGOUT =================

  const handleLogout = () => {
    sessionStorage.removeItem('mistryAdminToken');

    setAppointments([]);
    setDashboardError('');
    setSearchTerm('');
    setStatusFilter('ALL');
    setSortBy('NEWEST');
    setAppointmentView('ACTIVE');
    setUsername('');
    setPassword('');
    setIsLoggedIn(false);
  };

  // ================= FORMAT DATE =================

  const formatDate = (date) => {
    if (!date) {
      return '-';
    }

    const parts = date.split('-');

    if (parts.length !== 3) {
      return date;
    }

    const [year, month, day] = parts;

    const dateObject = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return dateObject.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ================= FORMAT TIME =================

  const formatTime = (time) => {
    if (!time) {
      return '-';
    }

    const [hours, minutes] = time.split(':');

    const timeObject = new Date();

    timeObject.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return timeObject.toLocaleTimeString('en-CA', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // ================= ACTIVE / ARCHIVED =================

  const activeAppointments = appointments.filter(
    (appointment) => Number(appointment.archived || 0) === 0
  );

  const archivedAppointments = appointments.filter(
    (appointment) => Number(appointment.archived || 0) === 1
  );

  const appointmentsForView =
    appointmentView === 'ARCHIVED'
      ? archivedAppointments
      : activeAppointments;

  // ================= FILTER APPOINTMENTS =================

  const filteredAppointments = appointmentsForView.filter(
    (appointment) => {
      const appointmentStatus =
        appointment.status || 'PENDING';

      const matchesStatus =
        statusFilter === 'ALL' ||
        appointmentStatus === statusFilter;

      const search = searchTerm.trim().toLowerCase();

      if (!search) {
        return matchesStatus;
      }

      const matchesSearch =
        String(appointment.id).includes(search) ||
        (appointment.name || '')
          .toLowerCase()
          .includes(search) ||
        (appointment.phone || '')
          .toLowerCase()
          .includes(search) ||
        (appointment.email || '')
          .toLowerCase()
          .includes(search) ||
        (appointment.vehicle || '')
          .toLowerCase()
          .includes(search) ||
        (appointment.service || '')
          .toLowerCase()
          .includes(search);

      return matchesStatus && matchesSearch;
    }
  );

  // ================= SORT APPOINTMENTS =================

  const sortedAppointments = [...filteredAppointments].sort(
    (a, b) => {
      if (sortBy === 'OLDEST') {
        return Number(a.id) - Number(b.id);
      }

      if (sortBy === 'APPOINTMENT_DATE') {
        const dateA = new Date(
          `${a.preferred_date || '9999-12-31'}T${
            a.preferred_time || '23:59'
          }`
        );

        const dateB = new Date(
          `${b.preferred_date || '9999-12-31'}T${
            b.preferred_time || '23:59'
          }`
        );

        return dateA - dateB;
      }

      // Default: NEWEST
      return Number(b.id) - Number(a.id);
    }
  );

  // ================= ADMIN DASHBOARD =================

  if (isLoggedIn) {
    return (
      <div className="admin-page admin-dashboard-page">

        <div className="admin-dashboard">
          {/* ================= ADMIN SIDEBAR ================= */}

<aside className="admin-sidebar">

  <div className="admin-sidebar-brand">

    <img
      src="/images/mistry-logo.png"
      alt="Mistry Auto Repair Center"
    />

    <div>
      <strong>MISTRY</strong>
      <span>ADMIN PORTAL</span>
    </div>

  </div>


  <nav className="admin-sidebar-nav">

    <button
      type="button"
      className={adminSection === 'dashboard' ? 'active' : ''}
      onClick={() => setAdminSection('dashboard')}
    >
      <span className="admin-nav-icon">⌂</span>

      <div>
        <strong>Dashboard</strong>
        <small>Overview & activity</small>
      </div>
    </button>


    <button
      type="button"
      className={adminSection === 'appointments' ? 'active' : ''}
      onClick={() => setAdminSection('appointments')}
    >
      <span className="admin-nav-icon">▣</span>

      <div>
        <strong>Appointments</strong>
        <small>Manage bookings</small>
      </div>

      {activeAppointments.length > 0 && (
        <span className="admin-nav-count">
          {activeAppointments.length}
        </span>
      )}
    </button>


    <button
      type="button"
      className={adminSection === 'services' ? 'active' : ''}
      onClick={() => setAdminSection('services')}
    >
      <span className="admin-nav-icon">◆</span>

      <div>
        <strong>Services & Pricing</strong>
        <small>Website services</small>
      </div>
    </button>


    <button
      type="button"
      className={adminSection === 'availability' ? 'active' : ''}
      onClick={() => setAdminSection('availability')}
    >
      <span className="admin-nav-icon">▦</span>

      <div>
        <strong>Availability</strong>
        <small>Shop schedule</small>
      </div>
    </button>

  </nav>


  <div className="admin-sidebar-bottom">

    <a
      href="/"
      target="_blank"
      rel="noreferrer"
      className="admin-sidebar-website"
    >
      <span>↗</span>

      <div>
        <strong>View Website</strong>
        <small>Open customer site</small>
      </div>
    </a>


    <button
      type="button"
      className="admin-sidebar-logout"
      onClick={handleLogout}
    >
      <span>⇥</span>

      <div>
        <strong>Logout</strong>
        <small>End admin session</small>
      </div>
    </button>

  </div>

</aside>

          {/* ================= ADMIN MAIN CONTENT ================= */}

          <main className="admin-main-content">

          <div className="admin-dashboard-header">

            <div className="admin-dashboard-brand">

              <div>
                <div className="admin-label">
                  ADMIN DASHBOARD
                </div>

                <h1>
                  {adminSection === 'dashboard' && 'Dashboard'}
                  {adminSection === 'appointments' && 'Appointments'}
                  {adminSection === 'services' && 'Services & Pricing'}
                  {adminSection === 'availability' && 'Availability'}
                </h1>

                <p>
                  {adminSection === 'dashboard' &&
                    'Overview of your garage activity.'}

                  {adminSection === 'appointments' &&
                    'Manage customer appointment requests.'}

                  {adminSection === 'services' &&
                    'Manage services, pricing and website visibility.'}

                  {adminSection === 'availability' &&
                    'Manage unavailable shop dates and appointment availability.'}
                </p>
              </div>

            </div>

            <div className="admin-header-actions">

              <button
                type="button"
                className="admin-refresh-button"
                onClick={loadAppointments}
                disabled={appointmentsLoading}
              >
                {appointmentsLoading
                  ? 'LOADING...'
                  : 'REFRESH'}
              </button>
              
            </div>

          </div>

          {/* ================= SUMMARY ================= */}

          {adminSection === 'dashboard' && (

          <div className="admin-dashboard-summary">

            <div className="admin-summary-card">
              <span>TOTAL ACTIVE</span>
              <strong>{activeAppointments.length}</strong>
            </div>

            <div className="admin-summary-card">
              <span>PENDING</span>

              <strong>
                {
                  activeAppointments.filter(
                    (appointment) =>
                      (appointment.status || 'PENDING') ===
                      'PENDING'
                  ).length
                }
              </strong>
            </div>

            <div className="admin-summary-card">
              <span>CONFIRMED</span>

              <strong>
                {
                  activeAppointments.filter(
                    (appointment) =>
                      appointment.status === 'CONFIRMED'
                  ).length
                }
              </strong>
            </div>

            <div className="admin-summary-card">
              <span>COMPLETED</span>

              <strong>
                {
                  activeAppointments.filter(
                    (appointment) =>
                      appointment.status === 'COMPLETED'
                  ).length
                }
              </strong>
            </div>

            <div className="admin-summary-card">
              <span>CANCELLED</span>

              <strong>
                {
                  activeAppointments.filter(
                    (appointment) =>
                      appointment.status === 'CANCELLED'
                  ).length
                }
              </strong>
            </div>

          </div>

          )}      

          {/* ================= SERVICES & PRICING ================= */}

          {adminSection === 'services' && (

          <div className="admin-services-section">

            <div className="admin-services-header">

              <div>
                <span className="admin-section-label">
                  WEBSITE MANAGEMENT
                </span>

                <h2>Services & Pricing</h2>

                <p>
                  Manage the services and prices displayed on your website.
                </p>
              </div>

              <button
                type="button"
                className="admin-add-service-button"
                onClick={openAddService}
              >
                <span>+</span>
                ADD NEW SERVICE
              </button>

            </div>


            {servicesMessage && (
              <div className="admin-services-message">
                {servicesMessage}
              </div>
            )}


            {servicesLoading ? (

              <div className="admin-services-empty">
                Loading services...
              </div>

            ) : services.length === 0 ? (

              <div className="admin-services-empty">
                <h3>No Services Found</h3>
                <p>Add your first service to get started.</p>
              </div>

            ) : (

              <div className="admin-services-list">

                {services.map((service) => (

                  <div
                    className={`admin-service-row ${
                      Number(service.active) === 1
                        ? ''
                        : 'admin-service-hidden'
                    }`}
                    key={service.id}
                  >

                    <div className="admin-service-main">

                      <div className="admin-service-image">

                        {service.image ? (
                          <img
                            src={service.image}
                            alt={service.name}
                          />
                        ) : (
                          <span>🔧</span>
                        )}

                      </div>

                      <div className="admin-service-info">

                        <h3>{service.name}</h3>

                        <p>
                          {service.description ||
                            'No description added.'}
                        </p>

                      </div>

                    </div>


                    <div className="admin-service-price">

                      <span>PRICE</span>

                      <strong>
                        {service.price || 'Not Set'}
                      </strong>

                    </div>


                    <div className="admin-service-visibility">

                      <span
                        className={`admin-service-status ${
                          Number(service.active) === 1
                            ? 'active'
                            : 'hidden'
                        }`}
                      >
                        <i></i>

                        {Number(service.active) === 1
                          ? 'ACTIVE'
                          : 'HIDDEN'}
                      </span>

                    </div>


                    <div className="admin-service-actions">

                      <button
                        type="button"
                        className="admin-service-edit-button"
                        onClick={() =>
                          openEditService(service)
                        }
                      >
                        EDIT
                      </button>

                      <button
                        type="button"
                        className={
                          Number(service.active) === 1
                            ? 'admin-service-hide-button'
                            : 'admin-service-show-button'
                        }
                        onClick={() =>
                          handleToggleService(service)
                        }
                      >
                        {Number(service.active) === 1
                          ? 'HIDE'
                          : 'SHOW'}
                      </button>

                      <button
                        type="button"
                        className="admin-service-delete-button"
                        disabled={
                          deletingServiceId === service.id
                        }
                        onClick={() =>
                          handleDeleteService(service)
                        }
                      >
                        {deletingServiceId === service.id
                          ? '...'
                          : 'DELETE'}
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

          )}

          {/* ================= APPOINTMENT AVAILABILITY ================= */}

          {adminSection === 'availability' && (

          <div className="admin-block-date-section">

            <div className="admin-block-date-header">
              <div>
                <span>APPOINTMENT AVAILABILITY</span>
                <h2>Block Appointment Date</h2>
                <p>
                  Block a date when the shop is fully booked or closed.
                </p>
              </div>
            </div>

            <div className="admin-block-date-form">

              <input
                type="date"
                value={blockDate}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={(e) => setBlockDate(e.target.value)}
              />

              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              >
                <option value="Fully Booked">Fully Booked</option>
                <option value="Holiday">Holiday</option>
                <option value="Shop Closed">Shop Closed</option>
              </select>

              <button
                type="button"
                onClick={handleBlockDate}
                disabled={blockingDate}
              >
                {blockingDate ? 'BLOCKING...' : 'BLOCK DATE'}
              </button>

            </div>

            {blockDateMessage && (
              <div className="admin-block-date-message">
                {blockDateMessage}
              </div>
            )}

            {blockedDates.length > 0 && (
              <div className="admin-blocked-dates">

                {blockedDates.map((item) => (
                  <div
                    className="admin-blocked-date-item"
                    key={item.id}
                  >
                    <div>
                      <strong>{formatDate(item.blocked_date)}</strong>
                      <span>{item.reason}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnblockDate(item.id)}
                    >
                      UNBLOCK
                    </button>
                  </div>
                ))}

              </div>
            )}

          </div>

        )}

          {/* ================= ACTIVE / ARCHIVED VIEW ================= */}

          {adminSection === 'appointments' && (
          <>

          <div className="admin-view-tabs">

            <button
              type="button"
              className={
                appointmentView === 'ACTIVE'
                  ? 'active'
                  : ''
              }
              onClick={() => {
                setAppointmentView('ACTIVE');
                setStatusFilter('ALL');
              }}
            >
              ACTIVE APPOINTMENTS
              <span>{activeAppointments.length}</span>
            </button>

            <button
              type="button"
              className={
                appointmentView === 'ARCHIVED'
                  ? 'active'
                  : ''
              }
              onClick={() => {
                setAppointmentView('ARCHIVED');
                setStatusFilter('ALL');
              }}
            >
              ARCHIVED APPOINTMENTS
              <span>{archivedAppointments.length}</span>
            </button>

          </div>

          {/* ================= SEARCH & FILTER ================= */}

          <div className="admin-tools">

            <div className="admin-search">

              <span className="admin-search-icon">
                🔍
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Search name, phone, vehicle, email, service or appointment #"
              />

            </div>

            <div className="admin-filter-buttons">

              {[
                'ALL',
                'PENDING',
                'CONFIRMED',
                'COMPLETED',
                'CANCELLED'
              ].map((status) => (

                <button
                  key={status}
                  type="button"
                  className={
                    statusFilter === status
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setStatusFilter(status)
                  }
                >
                  {status}
                </button>

              ))}

            </div>

          </div>

          {/* ================= SORT ================= */}

          <div className="admin-sort-row">

            <div className="admin-results-info">
              SHOWING {sortedAppointments.length} OF{' '}
              {appointmentsForView.length}{' '}
              {appointmentView === 'ARCHIVED'
                ? 'ARCHIVED'
                : 'ACTIVE'}{' '}
              APPOINTMENTS
            </div>

            <div className="admin-sort">

              <label htmlFor="appointment-sort">
                SORT BY
              </label>

              <select
                id="appointment-sort"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >
                <option value="NEWEST">
                  Newest
                </option>

                <option value="OLDEST">
                  Oldest
                </option>

                <option value="APPOINTMENT_DATE">
                  Appointment Date
                </option>
              </select>

            </div>

          </div>

          {/* ================= ERROR ================= */}

          {dashboardError && (
            <div className="admin-error">
              {dashboardError}
            </div>
          )}

          {/* ================= APPOINTMENTS ================= */}

          {appointmentsLoading ? (

            <div className="admin-empty">
              Loading appointments...
            </div>

          ) : appointmentsForView.length === 0 ? (

            <div className="admin-empty">

              <h2>
                {appointmentView === 'ARCHIVED'
                  ? 'No Archived Appointments'
                  : 'No Active Appointments'}
              </h2>

              <p>
                {appointmentView === 'ARCHIVED'
                  ? 'Archived appointments will appear here.'
                  : 'New appointment requests will appear here.'}
              </p>

            </div>

          ) : sortedAppointments.length === 0 ? (

            <div className="admin-empty">

              <h2>No Matching Appointments</h2>

              <p>
                Try another search or status filter.
              </p>

            </div>

          ) : (

            <div className="admin-appointments">

              {sortedAppointments.map((appointment) => (

                <div
                  className="admin-appointment-card"
                  key={appointment.id}
                >

                  <div className="admin-appointment-top">

                    <div>
                      <span className="admin-appointment-number">
                        APPOINTMENT #{appointment.id}
                      </span>

                      <h2>
                        {appointment.name}
                      </h2>
                    </div>

                    <span
                      className={`admin-status admin-status-${(
                        appointment.status || 'PENDING'
                      ).toLowerCase()}`}
                    >
                      {appointment.status || 'PENDING'}
                    </span>

                  </div>

                  <div className="admin-appointment-grid">

                    <div className="admin-detail">
                      <span>PHONE</span>

                      <a href={`tel:${appointment.phone}`}>
                        {appointment.phone}
                      </a>
                    </div>

                    <div className="admin-detail">
                      <span>EMAIL</span>

                      <a href={`mailto:${appointment.email}`}>
                        {appointment.email}
                      </a>
                    </div>

                    <div className="admin-detail">
                      <span>VEHICLE</span>

                      <strong>
                        {appointment.vehicle}
                      </strong>
                    </div>

                    <div className="admin-detail">
                      <span>SERVICE</span>

                      <strong>
                        {appointment.service}
                      </strong>
                    </div>

                    <div className="admin-detail">
                      <span>PREFERRED DATE</span>

                      <strong>
                        {formatDate(
                          appointment.preferred_date
                        )}
                      </strong>
                    </div>

                    <div className="admin-detail">
                      <span>PREFERRED TIME</span>

                      <strong>
                        {formatTime(
                          appointment.preferred_time
                        )}
                      </strong>
                    </div>

                  </div>

                  {appointment.message && (
                    <div className="admin-message">

                      <span>CUSTOMER MESSAGE</span>

                      <p>
                        {appointment.message}
                      </p>

                    </div>
                  )}

                  {/* ================= STATUS BUTTONS ================= */}

                  {appointmentView === 'ACTIVE' && (

                    <div className="admin-status-actions">

                      <span>
                        CHANGE STATUS
                      </span>

                      <div className="admin-status-buttons">

                        <button
                          type="button"
                          className={
                            (appointment.status || 'PENDING') ===
                            'PENDING'
                              ? 'active'
                              : ''
                          }
                          disabled={
                            updatingId === appointment.id ||
                            archivingId === appointment.id
                          }
                          onClick={() =>
                            updateStatus(
                              appointment.id,
                              'PENDING'
                            )
                          }
                        >
                          PENDING
                        </button>

                        <button
                          type="button"
                          className={
                            appointment.status === 'CONFIRMED'
                              ? 'active'
                              : ''
                          }
                          disabled={
                            updatingId === appointment.id ||
                            archivingId === appointment.id
                          }
                          onClick={() =>
                            updateStatus(
                              appointment.id,
                              'CONFIRMED'
                            )
                          }
                        >
                          CONFIRMED
                        </button>

                        <button
                          type="button"
                          className={
                            appointment.status === 'COMPLETED'
                              ? 'active'
                              : ''
                          }
                          disabled={
                            updatingId === appointment.id ||
                            archivingId === appointment.id
                          }
                          onClick={() =>
                            updateStatus(
                              appointment.id,
                              'COMPLETED'
                            )
                          }
                        >
                          COMPLETED
                        </button>

                        <button
                          type="button"
                          className={
                            appointment.status === 'CANCELLED'
                              ? 'active'
                              : ''
                          }
                          disabled={
                            updatingId === appointment.id ||
                            archivingId === appointment.id
                          }
                          onClick={() =>
                            updateStatus(
                              appointment.id,
                              'CANCELLED'
                            )
                          }
                        >
                          CANCELLED
                        </button>

                      </div>

                    </div>

                  )}

                  {/* ================= ARCHIVE / RESTORE ================= */}

                  <div className="admin-archive-actions">

                    {appointmentView === 'ACTIVE' ? (

                      <button
                        type="button"
                        className="admin-archive-button"
                        disabled={
                          archivingId === appointment.id ||
                          updatingId === appointment.id
                        }
                        onClick={() =>
                          updateArchive(
                            appointment.id,
                            true
                          )
                        }
                      >
                        {archivingId === appointment.id
                          ? 'ARCHIVING...'
                          : 'ARCHIVE APPOINTMENT'}
                      </button>

                    ) : (

                      <button
                        type="button"
                        className="admin-restore-button"
                        disabled={
                          archivingId === appointment.id
                        }
                        onClick={() =>
                          updateArchive(
                            appointment.id,
                            false
                          )
                        }
                      >
                        {archivingId === appointment.id
                          ? 'RESTORING...'
                          : 'RESTORE APPOINTMENT'}
                      </button>

                    )}

                  </div>

                </div>

              ))}

            </div>

          )}

          </>
        )}

          {/* ================= SERVICE EDITOR MODAL ================= */}

          {serviceEditorOpen && (

            <div
              className="admin-service-modal-overlay"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  closeServiceEditor();
                }
              }}
            >

              <div className="admin-service-modal">

                <div className="admin-service-modal-header">

                  <div>
                    <span className="admin-section-label">
                      {editingService
                        ? 'EDIT SERVICE'
                        : 'NEW SERVICE'}
                    </span>

                    <h2>
                      {editingService
                        ? 'Update Service'
                        : 'Add New Service'}
                    </h2>

                    <p>
                      {editingService
                        ? 'Update the service information shown on your website.'
                        : 'Create a new service for your website.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-service-modal-close"
                    onClick={closeServiceEditor}
                    disabled={savingService}
                    aria-label="Close"
                  >
                    ×
                  </button>

                </div>


                <div className="admin-service-modal-body">

                  <div className="admin-service-form-field">

                    <label>SERVICE NAME *</label>

                    <input
                      type="text"
                      name="name"
                      value={serviceForm.name}
                      onChange={handleServiceFormChange}
                      placeholder="Example: Oil Change"
                      autoFocus
                    />

                  </div>


                  <div className="admin-service-form-field">

                    <label>DESCRIPTION</label>

                    <textarea
                      name="description"
                      value={serviceForm.description}
                      onChange={handleServiceFormChange}
                      placeholder="Short description of this service"
                      rows="4"
                    />

                  </div>


                  <div className="admin-service-form-grid">

                    <div className="admin-service-form-field">

                      <label>PRICE</label>

                      <input
                        type="text"
                        name="price"
                        value={serviceForm.price}
                        onChange={handleServiceFormChange}
                        placeholder="Example: $79.99"
                      />

                      <small>
                        Example: $79.99, From $99, or Call for Price
                      </small>

                    </div>


                    <div className="admin-service-form-field">

                      <label>IMAGE PATH</label>

                      <input
                        type="text"
                        name="image"
                        value={serviceForm.image}
                        onChange={handleServiceFormChange}
                        placeholder="/images/services/oil-change.png"
                        disabled={!!editingService}
                      />

                      <small>
                        Website service image.
                      </small>

                    </div>

                  </div>


                  {editingService && (

                    <div className="admin-service-visibility-card">

                      <div>
                        <strong>Website Visibility</strong>

                        <span>
                          {serviceForm.active
                            ? 'Customers can see this service.'
                            : 'This service is hidden from customers.'}
                        </span>
                      </div>


                      <label className="admin-service-switch">

                        <input
                          type="checkbox"
                          name="active"
                          checked={serviceForm.active}
                          onChange={handleServiceFormChange}
                        />

                        <span className="admin-service-switch-slider"></span>

                      </label>

                    </div>

                  )}

                </div>


                <div className="admin-service-modal-footer">

                  <button
                    type="button"
                    className="admin-service-cancel-button"
                    onClick={closeServiceEditor}
                    disabled={savingService}
                  >
                    CANCEL
                  </button>

                  <button
                    type="button"
                    className="admin-service-save-button"
                    onClick={handleSaveService}
                    disabled={
                      savingService ||
                      !serviceForm.name.trim()
                    }
                  >
                    {savingService
                      ? 'SAVING...'
                      : editingService
                        ? 'SAVE CHANGES'
                        : 'ADD SERVICE'}
                  </button>

                </div>
              </div>

            </div>

          )}

        </main>

      </div>

    </div>
    );
  }

  // ================= LOGIN PAGE =================

  return (
    <div className="admin-page">

      <div className="admin-login-card">

        <img
          src="/images/mistry-logo.png"
          alt="Mistry Auto Repair Center"
          className="admin-logo"
        />

        <div className="admin-label">
          ADMIN PORTAL
        </div>

        <h1>Welcome Back</h1>

        <p className="admin-subtitle">
          Sign in to manage appointment requests.
        </p>

        <form onSubmit={handleLogin}>

          <div className="admin-field">

            <label>
              USERNAME
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter username"
              autoComplete="username"
              required
            />

          </div>

          <div className="admin-field">

            <label>
              PASSWORD
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />

          </div>

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? 'SIGNING IN...'
              : 'SIGN IN →'}
          </button>

        </form>

        <div className="admin-security">
          MISTRY AUTO • SECURE ADMIN ACCESS
        </div>

      </div>

    </div>
  );
}

export default Admin;