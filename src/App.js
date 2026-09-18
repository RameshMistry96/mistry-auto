import { useEffect, useState } from 'react';
import Admin from './Admin';
import './App.css';

function App() {

  /* ================= REVIEWS DATA ================= */

  const reviews = [
    {
      name: "Customer One",
      date: "Google Review",
      rating: 5,
      text: "Excellent service and a great experience. The team was professional, helpful and took great care of my vehicle."
    },
    {
      name: "Customer Two",
      date: "Google Review",
      rating: 5,
      text: "Very professional automotive service. Clear communication, quality work and friendly customer service."
    },
    {
      name: "Customer Three",
      date: "Google Review",
      rating: 5,
      text: "A dependable shop for vehicle maintenance and repairs. I was very happy with the service."
    },
    {
      name: "Customer Four",
      date: "Google Review",
      rating: 5,
      text: "Great customer service and professional work. I would recommend Mistry Auto Repair Center."
    }
  ];

  const [currentReview, setCurrentReview] = useState(0);

  // ================= SERVICE DETAILS =================

const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((current) => (current + 1) % reviews.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [reviews.length]);

  const previousReview = () => {
    setCurrentReview((current) =>
      current === 0 ? reviews.length - 1 : current - 1
    );
  };

  const nextReview = () => {
    setCurrentReview((current) => (current + 1) % reviews.length);
  };

  // ================= APPOINTMENT SUBMIT =================

const [appointmentStatus, setAppointmentStatus] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

const handleAppointmentSubmit = async (event) => {
  event.preventDefault();

  setIsSubmitting(true);
  setAppointmentStatus('');

  const form = event.target;

  const appointmentData = {
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value,
    vehicle: form.vehicle.value,
    service: form.service.value,
    preferredDate: form.preferredDate.value,
    preferredTime: form.preferredTime.value,
    message: form.message.value
  };

  try {
    const response = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to submit appointment.');
    }

    setAppointmentStatus(
      'SUCCESS: Your appointment request has been received. We will contact you to confirm.'
    );

    form.reset();
  } catch (error) {
    console.error(error);

    setAppointmentStatus(
      'ERROR: Unable to send your appointment request. Please try again.'
    );
  } finally {
    setIsSubmitting(false);
  }
};


if (window.location.pathname === '/admin') {
  return <Admin />;
}

return (
  <div className="App">

      {/* ================= NAVBAR ================= */}
      <header className="navbar">

        <div className="nav-container">

          <img
            src="/images/mistry-logo.png"
            alt="Mistry Auto Repair Center"
            className="nav-logo"
          />

          <nav className="nav-links">

            <a href="#home" className="active">HOME</a>
            <a href="#services">SERVICES</a>
            <a href="#about">ABOUT US</a>
            <a href="#gallery">GALLERY</a>
            <a href="#reviews">REVIEWS</a>
            <a href="#contact">CONTACT</a>

            <a href="#appointment" className="appointment-btn">
              BOOK APPOINTMENT
            </a>

          </nav>

        </div>

      </header>


      {/* ================= HERO ================= */}
      <section className="hero" id="home">

        <div className="hero-overlay"></div>

        <div className="hero-container">

          <div className="hero-content">

            <span className="hero-small-title">
              WELCOME TO MISTRY
            </span>

            <h1>
              AUTO REPAIR
              <br />
              <span>CENTER INC.</span>
            </h1>

            <div className="hero-line"></div>

            <h2>
              PRECISION <span>•</span> PERFORMANCE <span>•</span> TRUST
            </h2>

            <p>
              Professional automotive repair and maintenance
              services you can depend on.
            </p>

            <div className="hero-buttons">

              <a href="#appointment" className="hero-primary-btn">
                BOOK APPOINTMENT
              </a>

              <a href="#services" className="hero-secondary-btn">
                OUR SERVICES →
              </a>

            </div>

          </div>

        </div>

      </section>


      {/* ================= SERVICES ================= */}
      <section className="services-section" id="services">

        <div className="services-heading">

          <span>WHAT WE DO</span>

          <h2>COMPLETE CAR REPAIR</h2>

          <p>
            Complete automotive repair and maintenance services
            for all makes and models.
          </p>

        </div>


        <div className="services-grid">

          <ServiceCard
            image="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80"
            title="SAFETY"
            description="Professional vehicle safety inspections to help keep your vehicle safe and road-ready."
            onLearnMore={() =>
              setSelectedService({
                title: 'SAFETY',
                image:
                  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
                description:
                  'Our vehicle safety inspection helps identify important safety-related concerns and ensures your vehicle is properly inspected by our automotive service team.',
                includes: [
                  'Vehicle safety inspection',
                  'Brake system inspection',
                  'Tire and wheel inspection',
                  'Steering and suspension inspection',
                  'Lights and safety equipment check'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=900&q=80"
            title="OIL CHANGE & TRANSMISSION SERVICE"
            description="Oil changes and transmission service to help protect your vehicle and maintain reliable performance."
            onLearnMore={() =>
              setSelectedService({
                title: 'OIL CHANGE & TRANSMISSION SERVICE',
                image:
                  'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=900&q=80',
                description:
                  'Regular oil and transmission service helps protect important vehicle components and supports smooth, reliable performance.',
                includes: [
                  'Engine oil change',
                  'Oil filter replacement',
                  'Fluid level inspection',
                  'Transmission fluid inspection',
                  'Transmission service when required'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1632823471565-1ecdf5c6d7f0?auto=format&fit=crop&w=900&q=80"
            title="BRAKE JOB"
            description="Brake inspection, maintenance and repair for dependable stopping performance."
            onLearnMore={() =>
              setSelectedService({
                title: 'BRAKE JOB',
                image:
                  'https://images.unsplash.com/photo-1632823471565-1ecdf5c6d7f0?auto=format&fit=crop&w=900&q=80',
                description:
                  'Our brake service helps identify worn or damaged brake components and restore dependable braking performance.',
                includes: [
                  'Brake system inspection',
                  'Brake pad inspection and replacement',
                  'Rotor inspection and service',
                  'Brake fluid inspection',
                  'Brake performance check'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80"
            title="TUNE-UP"
            description="Routine tune-up services to help your engine run smoothly, efficiently and reliably."
            onLearnMore={() =>
              setSelectedService({
                title: 'TUNE-UP',
                image:
                  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80',
                description:
                  'Routine tune-up service can help maintain engine performance, reliability and fuel efficiency.',
                includes: [
                  'Engine performance inspection',
                  'Spark plug inspection and replacement',
                  'Air filter inspection',
                  'Fluid level inspection',
                  'General engine condition check'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=900&q=80"
            title="SUSPENSION"
            description="Suspension inspection and repair for improved handling, stability and ride comfort."
            onLearnMore={() =>
              setSelectedService({
                title: 'SUSPENSION',
                image:
                  'https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=900&q=80',
                description:
                  'Our suspension service helps identify worn or damaged components that may affect handling, stability and ride comfort.',
                includes: [
                  'Suspension system inspection',
                  'Shock and strut inspection',
                  'Control arm inspection',
                  'Ball joint inspection',
                  'Steering component inspection'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=900&q=80"
            title="TIRE CHANGE & BALANCING"
            description="Professional tire changes and balancing for smooth, safe and dependable driving."
            onLearnMore={() =>
              setSelectedService({
                title: 'TIRE CHANGE & BALANCING',
                image:
                  'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=900&q=80',
                description:
                  'Professional tire service helps provide a smoother ride and supports proper handling and tire performance.',
                includes: [
                  'Seasonal tire change',
                  'Tire mounting',
                  'Wheel balancing',
                  'Tire condition inspection',
                  'Tire pressure check'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80"
            title="EXHAUST REPAIR"
            description="Inspection and repair of exhaust system components to keep your vehicle operating properly."
            onLearnMore={() =>
              setSelectedService({
                title: 'EXHAUST REPAIR',
                image:
                  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
                description:
                  'We inspect exhaust system components for damage, leaks and wear and provide repairs when required.',
                includes: [
                  'Exhaust system inspection',
                  'Exhaust leak inspection',
                  'Muffler inspection and repair',
                  'Pipe and connection inspection',
                  'Damaged component replacement'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7f?auto=format&fit=crop&w=900&q=80"
            title="RUST PROOFING"
            description="Rust protection services designed to help protect your vehicle from corrosion."
            onLearnMore={() =>
              setSelectedService({
                title: 'RUST PROOFING',
                image:
                  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7f?auto=format&fit=crop&w=900&q=80',
                description:
                  'Rust proofing helps protect vulnerable areas of your vehicle from moisture, road salt and corrosion.',
                includes: [
                  'Vehicle condition inspection',
                  'Rust-prone area inspection',
                  'Protective rust treatment',
                  'Underbody protection',
                  'Corrosion prevention service'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80"
            title="A/C & HEATING"
            description="Air conditioning and heating inspection and repair for comfortable driving year-round."
            onLearnMore={() =>
              setSelectedService({
                title: 'A/C & HEATING',
                image:
                  'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80',
                description:
                  'Our A/C and heating service helps diagnose climate-control problems so your vehicle stays comfortable throughout the year.',
                includes: [
                  'A/C system inspection',
                  'Heating system inspection',
                  'Airflow inspection',
                  'Climate-control diagnosis',
                  'System repair when required'
                ]
              })
            }
          />


          <ServiceCard
            image="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80"
            title="ELECTRICAL REPAIR"
            description="Professional diagnosis and repair of automotive electrical and electronic systems."
            onLearnMore={() =>
              setSelectedService({
                title: 'ELECTRICAL REPAIR',
                image:
                  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
                description:
                  'We diagnose automotive electrical problems and repair affected components to help restore reliable vehicle operation.',
                includes: [
                  'Electrical system diagnosis',
                  'Battery and charging system inspection',
                  'Starter system inspection',
                  'Lighting system diagnosis',
                  'Wiring and electrical component inspection'
                ]
              })
            }
          />

        </div>

      </section>

{/* ================= SERVICE DETAILS POPUP ================= */}

{selectedService && (

  <div className="service-modal">

    <div
      className="service-modal-overlay"
      onClick={() => setSelectedService(null)}
    ></div>

    <div className="service-modal-content">

      <button
        type="button"
        className="service-modal-close"
        onClick={() => setSelectedService(null)}
        aria-label="Close service details"
      >
        ×
      </button>


      <div className="service-modal-image">

        <img
          src={selectedService.image}
          alt={selectedService.title}
        />

      </div>


      <div className="service-modal-info">

        <span className="service-modal-small">
          MISTRY AUTO SERVICE
        </span>

        <h2>{selectedService.title}</h2>

        <div className="service-modal-line"></div>

        <p className="service-modal-description">
          {selectedService.description}
        </p>


        <h3>SERVICE MAY INCLUDE</h3>

        <div className="service-modal-list">

          {selectedService.includes.map((item, index) => (

            <div
              className="service-modal-list-item"
              key={index}
            >
              <span>✓</span>
              <p>{item}</p>
            </div>

          ))}

        </div>


        <a
          href="#appointment"
          className="service-modal-book"
          onClick={() => setSelectedService(null)}
        >
          BOOK APPOINTMENT →
        </a>

      </div>

    </div>

  </div>

)}


{/* ================= WHY CHOOSE US ================= */}
      <section className="why-section">

        <div className="why-container">

          <div className="why-image">

            <img
              src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=85"
              alt="Professional automotive repair"
            />

            <div className="why-image-box">

              <strong>ALL MAKES</strong>

              <span>& MODELS</span>

            </div>

          </div>


          <div className="why-content">

            <span className="why-small-title">
              WHY CHOOSE US
            </span>

            <h2>
              QUALITY SERVICE.
              <br />
              <span>DEPENDABLE REPAIR.</span>
            </h2>

            <div className="why-line"></div>

            <p className="why-description">
              At Mistry Auto Repair Center Inc., we focus on dependable
              automotive service, quality workmanship and straightforward
              customer care.
            </p>


            <div className="why-features">

              <WhyItem
                number="01"
                title="EXPERIENCED SERVICE"
                text="Professional automotive service for your repair and maintenance needs."
              />

              <WhyItem
                number="02"
                title="QUALITY WORK"
                text="Careful attention to every vehicle that comes into our shop."
              />

              <WhyItem
                number="03"
                title="HONEST & RELIABLE"
                text="Clear communication and dependable service you can count on."
              />

              <WhyItem
                number="04"
                title="ALL MAKES & MODELS"
                text="Automotive repair and maintenance for a wide range of vehicles."
              />

            </div>


            <a href="#about" className="why-button">
              ABOUT MISTRY AUTO →
            </a>

          </div>

        </div>

      </section>


      {/* ================= ABOUT US ================= */}
      <section className="about-section" id="about">

        <div className="about-container">

          <div className="about-content">

            <span className="about-small-title">
              ABOUT MISTRY AUTO
            </span>

            <h2>
              YOUR TRUSTED
              <br />
              <span>AUTO REPAIR SHOP.</span>
            </h2>

            <div className="about-line"></div>

            <p className="about-main-text">
              At Mistry Auto Repair Center Inc., we provide professional
              automotive repair and maintenance services with a focus on
              quality workmanship, dependable service and customer
              satisfaction.
            </p>

            <p className="about-second-text">
              From regular maintenance to complete vehicle repairs, our goal
              is to help keep your vehicle safe, reliable and performing at
              its best. We service a wide range of makes and models and take
              pride in giving every vehicle the attention it deserves.
            </p>


            <div className="about-highlights">

              <AboutItem
                number="01"
                title="PROFESSIONAL SERVICE"
                text="Dependable automotive care for your vehicle."
              />

              <AboutItem
                number="02"
                title="QUALITY REPAIRS"
                text="Careful workmanship and attention to detail."
              />

              <AboutItem
                number="03"
                title="ALL MAKES & MODELS"
                text="Service for a wide range of cars and vehicles."
              />

            </div>


            <a href="#contact" className="about-button">
              CONTACT US →
            </a>

          </div>


          <div className="about-image">

            <img
              src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=85"
              alt="Mistry Auto Repair Center automotive service"
            />

            <div className="about-image-accent"></div>

            <div className="about-image-badge">

              <strong>COMPLETE</strong>

              <span>AUTO CARE</span>

            </div>

          </div>

        </div>

      </section>


      {/* ================= GALLERY ================= */}
      <section className="gallery-section" id="gallery">

        <div className="gallery-container">

          <div className="gallery-heading">

            <div className="gallery-heading-left">

              <span className="gallery-small-title">
                OUR WORK
              </span>

              <h2>
                INSIDE
                <br />
                <span>MISTRY AUTO.</span>
              </h2>

              <div className="gallery-line"></div>

            </div>


            <div className="gallery-heading-right">

              <p>
                Take a look at the vehicles, repairs and automotive work
                inside Mistry Auto Repair Center Inc.
              </p>

            </div>

          </div>


          <div className="gallery-filters">

            <button className="gallery-filter active">
              ALL
            </button>

            <button className="gallery-filter">
              GARAGE
            </button>

            <button className="gallery-filter">
              REPAIRS
            </button>

            <button className="gallery-filter">
              CARS
            </button>

            <button className="gallery-filter">
              BEFORE & AFTER
            </button>

            <button className="gallery-filter">
              VIDEOS
            </button>

          </div>


          <div className="gallery-grid">

            <GalleryItem
              image="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=85"
              category="GARAGE"
              title="INSIDE THE SHOP"
              large
            />

            <GalleryItem
              image="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1000&q=85"
              category="REPAIRS"
              title="ENGINE SERVICE"
            />

            <GalleryItem
              image="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1000&q=85"
              category="REPAIRS"
              title="PROFESSIONAL REPAIR"
            />

            <GalleryItem
              image="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7f?auto=format&fit=crop&w=1000&q=85"
              category="CARS"
              title="VEHICLE CARE"
            />

            <GalleryItem
              image="https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1000&q=85"
              category="GARAGE"
              title="AUTO SERVICE"
            />

            <GalleryItem
              image="https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=1000&q=85"
              category="VIDEOS"
              title="WORK IN ACTION"
              video
            />

          </div>


          <div className="gallery-bottom">

            <p>
              More photos and videos from Mistry Auto Repair Center
              will be added here.
            </p>

          </div>

        </div>

      </section>


      {/* ================= REVIEWS ================= */}
      <section className="reviews-section" id="reviews">

        <div className="reviews-container">


          <div className="reviews-heading">

            <span>GOOGLE REVIEWS</span>

            <h2>
              WHAT OUR
              <br />
              <strong>CUSTOMERS SAY.</strong>
            </h2>

            <div className="reviews-line"></div>

            <p>
              See what customers are saying about their experience
              with Mistry Auto Repair Center Inc.
            </p>

          </div>


          <div className="review-slider">


            {/* LEFT ARROW */}
            <button
              className="review-arrow review-arrow-left"
              onClick={previousReview}
              aria-label="Previous review"
            >
              ‹
            </button>


            {/* REVIEW CARD */}
            <div
              className="review-card"
              key={currentReview}
            >

              <div className="review-top">

                <div className="review-quote">
                  “
                </div>

                <div className="google-mark">
                  <span>G</span>
                </div>

              </div>


              <div className="review-stars">

                {[...Array(reviews[currentReview].rating)].map(
                  (_, index) => (
                    <span key={index}>★</span>
                  )
                )}

              </div>


              <p className="review-text">
                {reviews[currentReview].text}
              </p>


              <div className="review-divider"></div>


              <div className="review-customer">

                <div className="review-avatar">

                  {reviews[currentReview].name.charAt(0)}

                </div>


                <div className="review-customer-info">

                  <h3>
                    {reviews[currentReview].name}
                  </h3>

                  <p>
                    {reviews[currentReview].date}
                  </p>

                </div>


                <div className="review-google-label">
                  GOOGLE REVIEW
                </div>

              </div>

            </div>


            {/* RIGHT ARROW */}
            <button
              className="review-arrow review-arrow-right"
              onClick={nextReview}
              aria-label="Next review"
            >
              ›
            </button>

          </div>


          {/* REVIEW DOTS */}
          <div className="review-controls">

            <div className="review-dots">

              {reviews.map((review, index) => (

                <button
                  key={review.name}
                  className={
                    `review-dot ${
                      currentReview === index ? 'active' : ''
                    }`
                  }
                  onClick={() => setCurrentReview(index)}
                  aria-label={`Show review ${index + 1}`}
                ></button>

              ))}

            </div>


            <span className="review-count">

              {currentReview + 1} / {reviews.length}

            </span>

          </div>


          <div className="reviews-note">

            <span>★</span>

            <p>
              Google reviews will be connected here after
              the website design is finalized.
            </p>

          </div>

        </div>

      </section>

                  {/* ================= CONTACT + APPOINTMENT ================= */}
      <section className="contact-section" id="contact">

        <div className="contact-container">

          {/* LEFT SIDE */}
          <div className="contact-info">

            <span className="contact-small-title">
              GET IN TOUCH
            </span>

            <h2>
              VISIT MISTRY
              <br />
              <span>AUTO REPAIR.</span>
            </h2>

            <div className="contact-line"></div>

            <p className="contact-description">
              Need automotive service or have a question about your vehicle?
              Contact Mistry Auto Repair Center Inc. or request an appointment.
            </p>


            <div className="contact-details">

              <div className="contact-detail">

                <div className="contact-icon">
                  📍
                </div>

                <div>
                  <span>OUR LOCATION</span>

                  <h3>
                    55 Selby Rd, Unit C4
                    <br />
                    Brampton, ON L6W 1K5
                  </h3>
                </div>

              </div>


              <div className="contact-detail">

                <div className="contact-icon">
                  ☎
                </div>

                <div>
                  <span>CALL US</span>

                  <a href="tel:+16475338524">
                    +1 (647) 533-8524
                  </a>
                </div>

              </div>


              <div className="contact-detail">

                <div className="contact-icon">
                  ✉
                </div>

                <div>
                  <span>EMAIL US</span>

                  <a href="mailto:mistryauto29@gmail.com">
                    mistryauto29@gmail.com
                  </a>
                </div>

              </div>

            </div>


            {/* BUSINESS HOURS */}
            <div className="business-hours">

              <div className="business-hours-title">

                <span className="hours-icon">◷</span>

                <h3>BUSINESS HOURS</h3>

              </div>


              <div className="hours-row">

                <span>Monday – Friday</span>

                <strong>9:00 AM – 6:30 PM</strong>

              </div>


              <div className="hours-row">

                <span>Saturday</span>

                <strong>9:00 AM – 3:00 PM</strong>

              </div>


              <div className="hours-row closed">

                <span>Sunday</span>

                <strong>CLOSED</strong>

              </div>

            </div>

          </div>


          {/* RIGHT SIDE - APPOINTMENT */}
          <div className="appointment-panel" id="appointment">

            <div className="appointment-heading">

              <span>REQUEST SERVICE</span>

              <h2>BOOK AN APPOINTMENT</h2>

              <p>
                Complete the form below and our team will contact you
                to confirm your appointment.
              </p>

            </div>


            <form
              className="appointment-form"
              onSubmit={handleAppointmentSubmit}
            >

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="appointment-name">
                    NAME *
                  </label>

                  <input
                    id="appointment-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    required
                  />

                </div>


                <div className="form-group">

                  <label htmlFor="appointment-phone">
                    PHONE *
                  </label>

                  <input
                    id="appointment-phone"
                    name="phone"
                    type="tel"
                    placeholder="Your phone number"
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label htmlFor="appointment-email">
                  EMAIL *
                </label>

                <input
                  id="appointment-email"
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  required
                />

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="appointment-vehicle">
                    VEHICLE *
                  </label>

                <input
                  id="appointment-vehicle"
                  name="vehicle"
                  type="text"
                  placeholder="Year, make and model"
                  required
                />

                </div>


                <div className="form-group">

                  <label htmlFor="appointment-service">
                    SERVICE *
                  </label>

                  <select
                    id="appointment-service"
                    name="service"
                    defaultValue=""
                    required
                  >

                    <option value="" disabled>
                      Select service
                    </option>

                    <option>Safety</option>

                    <option>
                      Oil Change & Transmission Service
                    </option>

                    <option>Brake Job</option>

                    <option>Tune-Up</option>

                    <option>Suspension</option>

                    <option>Tire Change & Balancing</option>

                    <option>Exhaust Repair</option>

                    <option>Rust Proofing</option>

                    <option>A/C & Heating</option>

                    <option>Electrical Repair</option>

                    <option>Other</option>

                  </select>

                </div>

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="appointment-date">
                    PREFERRED DATE *
                  </label>

                  <input
                    id="appointment-date"
                    name="preferredDate"
                    type="date"
                    required
                  />

                </div>


                <div className="form-group">

                  <label htmlFor="appointment-time">
                    PREFERRED TIME *
                  </label>
                  <input
                    id="appointment-time"
                    name="preferredTime"
                    type="time"
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label htmlFor="appointment-message">
                  MESSAGE
                </label>

                <textarea
                  id="appointment-message"
                  name="message"
                  rows="5"
                  placeholder="Tell us about your vehicle or the service you need..."
                ></textarea>

              </div>

              <button
                type="submit"
                className="appointment-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'SENDING...' : 'REQUEST APPOINTMENT →'}
              </button>

              {appointmentStatus && (
                <p className="appointment-note">
                  {appointmentStatus}
                </p>
              )}

            </form>

          </div>

        </div>

      </section>

            {/* ================= FOOTER ================= */}
      <footer className="footer">

        <div className="footer-container">

          {/* GARAGE INFO */}
          <div className="footer-brand">

            <img
              src="/images/mistry-logo.png"
              alt="Mistry Auto Repair Center"
              className="footer-logo"
            />

            <p>
              Professional automotive repair and maintenance
              services you can depend on.
            </p>

            <a href="#appointment" className="footer-appointment-btn">
              BOOK APPOINTMENT →
            </a>

          </div>


          {/* QUICK LINKS */}
          <div className="footer-column">

            <h3>QUICK LINKS</h3>

            <div className="footer-line"></div>

            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#about">About Us</a>
            <a href="#gallery">Gallery</a>
            <a href="#reviews">Reviews</a>
            <a href="#contact">Contact</a>

          </div>


          {/* SERVICES */}
          <div className="footer-column">

            <h3>OUR SERVICES</h3>

            <div className="footer-line"></div>

            <a href="#services">Safety</a>
            <a href="#services">Oil Change</a>
            <a href="#services">Brake Job</a>
            <a href="#services">Tune-Up</a>
            <a href="#services">Suspension</a>
            <a href="#services">Tire Service</a>

          </div>


          {/* CONTACT */}
          <div className="footer-column footer-contact">

            <h3>CONTACT US</h3>

            <div className="footer-line"></div>

            <div className="footer-contact-item">
              <span>LOCATION</span>

              <p>
                55 Selby Rd, Unit C4
                <br />
                Brampton, ON L6W 1K5
              </p>
            </div>

            <div className="footer-contact-item">
              <span>PHONE</span>

              <a href="tel:+16475338524">
                +1 (647) 533-8524
              </a>
            </div>

            <div className="footer-contact-item">
              <span>EMAIL</span>

              <a href="mailto:mistryauto29@gmail.com">
                mistryauto29@gmail.com
              </a>
            </div>

          </div>

        </div>


        {/* BOTTOM FOOTER */}
        <div className="footer-bottom">

          <div className="footer-bottom-container">

            <p>
              © 2026 Mistry Auto Repair Center Inc. All Rights Reserved.
            </p>

            <a href="#home">
              BACK TO TOP ↑
            </a>

          </div>

        </div>

      </footer>

    </div>
  );
}


/* ================= SERVICE CARD ================= */

function ServiceCard({
  image,
  title,
  description,
  onLearnMore
}) {

  return (

    <div className="service-card">

      <div className="service-image">

        <img
          src={image}
          alt={title}
        />

      </div>

      <div className="service-content">

        <h3>{title}</h3>

        <p>{description}</p>

        <button
          type="button"
          className="service-learn-more"
          onClick={onLearnMore}
        >
          LEARN MORE →
        </button>

      </div>

    </div>

  );
}


/* ================= WHY CHOOSE ITEM ================= */

function WhyItem({ number, title, text }) {

  return (

    <div className="why-item">

      <div className="why-number">
        {number}
      </div>

      <div className="why-item-content">

        <h3>{title}</h3>

        <p>{text}</p>

      </div>

    </div>

  );
}


/* ================= ABOUT ITEM ================= */

function AboutItem({ number, title, text }) {

  return (

    <div className="about-highlight">

      <span>{number}</span>

      <div>

        <h3>{title}</h3>

        <p>{text}</p>

      </div>

    </div>

  );
}


/* ================= GALLERY ITEM ================= */

function GalleryItem({
  image,
  category,
  title,
  large = false,
  video = false
}) {

  return (

    <div
      className={`gallery-item ${
        large ? 'gallery-large' : ''
      }`}
    >

      <img
        src={image}
        alt={title}
      />


      <div className="gallery-overlay">

        <div className="gallery-info">

          <span>{category}</span>

          <h3>{title}</h3>

        </div>


        <div
          className={`gallery-icon ${
            video ? 'video-icon' : ''
          }`}
        >

          {video ? '▶' : '+'}

        </div>

      </div>

    </div>

  );
}


export default App;