import Footer from "../components/Footer.tsx";

export function PublicHome() {
  return (
    <div>

      {/* HERO CAROUSEL */}
      <div id="homeCarousel" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">

          {/* Slide 1 */}
          <div className="carousel-item active">
            <img
              src="/home1.jpeg"
              className="d-block w-100"
              style={{ height: "500px", objectFit: "cover" }}
              alt="gym"
            />
            <div className="carousel-caption d-md-block">
              <h2 className="fw-bold">Allenati al massimo</h2>
              <p>Raggiungi i tuoi obiettivi con FastFitness</p>
            </div>
          </div>

          {/* Slide 2 */}
          <div className="carousel-item">
            <img
              src="/home2.png"
              className="d-block w-100"
              style={{ height: "500px", objectFit: "cover" }}
              alt="training"
            />
            <div className="carousel-caption d-md-block">
              <h2 className="fw-bold">Programmi personalizzati</h2>
              <p>Allenamenti su misura per te</p>
            </div>
          </div>

          {/* Slide 3 */}
          <div className="carousel-item">
            <img
              src="/home3.jpeg"
              className="d-block w-100"
              style={{ height: "500px", objectFit: "cover" }}
              alt="fitness"
            />
            <div className="carousel-caption d-md-block">
              <h2 className="fw-bold">Diventa la tua versione migliore</h2>
              <p>Programmi pensati per trasformare il tuo corpo e la tua mente</p>
            </div>
          </div>

        </div>

        {/* CONTROLLI */}
        <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" />
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon" />
        </button>
      </div>

      {/* SEZIONE INFO */}
      <div className="container text-center my-5">
        <h2 className="mb-4">Perché scegliere FastFitness?</h2>

        <div className="row">
          <div className="col-md-4">
            <h4>🏋️‍♂️ Allenamenti</h4>
            <p>Piani personalizzati per ogni utente</p>
          </div>

          <div className="col-md-4">
            <h4>📊 Gestione</h4>
            <p>Organizza allenamenti e gestisci prenotazioni</p>
          </div>

          <div className="col-md-4">
            <h4>🔥 Motivazione</h4>
            <p>Raggiungi i tuoi obiettivi con determinazione</p>
          </div>
        </div>
      </div>

      {/* SERVIZI */}
      <div className="bg-light py-5">
        <div className="container text-center">
          <h2 className="mb-5">I nostri servizi</h2>

          <div className="row g-4">

            {/* Card 1 */}
            <div className="col-md-3">
              <div className="card h-100 shadow-sm border-0 service-card">
                <div className="card-body">
                  <div className="fs-1 mb-3">💪</div>
                  <h5 className="card-title">Personal Training</h5>
                  <p className="card-text">Allenamenti su misura per i tuoi obiettivi</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="col-md-3">
              <div className="card h-100 shadow-sm border-0 service-card">
                <div className="card-body">
                  <div className="fs-1 mb-3">🧘‍♂️</div>
                  <h5 className="card-title">Yoga & Stretching</h5>
                  <p className="card-text">Migliora flessibilità e benessere</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="col-md-3">
              <div className="card h-100 shadow-sm border-0 service-card">
                <div className="card-body">
                  <div className="fs-1 mb-3">🪖</div>
                  <h5 className="card-title">Preparazione militare</h5>
                  <p className="card-text">Allenamenti intensivi per prove fisiche</p>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="col-md-3">
              <div className="card h-100 shadow-sm border-0 service-card">
                <div className="card-body">
                  <div className="fs-1 mb-3">🥗</div>
                  <h5 className="card-title">Consulenza nutrizionale</h5>
                  <p className="card-text">Piani alimentari personalizzati</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* TESTIMONIANZE */}
      <div className="container text-center my-5">
        <h2 className="mb-5">Cosa dicono i nostri utenti</h2>

        <div className="row g-4">

          {/* Card 1 */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 testimonial-card">
              <div className="card-body">
                <div className="mb-3 fs-4">⭐⭐⭐⭐⭐</div>
                <p className="card-text">"Ho perso 10kg in 3 mesi!"</p>
                <div className="mt-3">
                  <div className="avatar">M</div>
                  <small className="d-block mt-2">Marco</small>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 testimonial-card">
              <div className="card-body">
                <div className="mb-3 fs-4">⭐⭐⭐⭐⭐</div>
                <p className="card-text">"Piattaforma semplice e super utile"</p>
                <div className="mt-3">
                  <div className="avatar">G</div>
                  <small className="d-block mt-2">Giulia</small>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 testimonial-card">
              <div className="card-body">
                <div className="mb-3 fs-4">⭐⭐⭐⭐⭐</div>
                <p className="card-text">"Allenamenti davvero efficaci"</p>
                <div className="mt-3">
                  <div className="avatar">L</div>
                  <small className="d-block mt-2">Luca</small>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer/>

    </div>
  );
}