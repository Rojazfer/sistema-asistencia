          {isReportsMenu && isProfessorRole ? (
            <>
              <article className="panel-card professor-daily-report">
                <h3>📊 Reporte Diario de Eventos</h3>
                <p>Visualiza todos los eventos del día con estadísticas de asistencia.</p>
                
                <div className="scope-selection">
                  <label htmlFor="daily-report-date">Fecha del reporte:</label>
                  <input
                    id="daily-report-date"
                    type="date"
                    value={dailyReportDate}
                    onChange={(e) => setDailyReportDate(e.target.value)}
                  />
                  <button type="button" onClick={() => loadDailyReport(dailyReportDate)} disabled={loadingDailyReport}>
                    {loadingDailyReport ? 'Cargando...' : 'Actualizar'}
                  </button>
                  {dailyReportMessage && <p className="message error">{dailyReportMessage}</p>}
                </div>

                {dailyReport ? (
                  <div className="daily-report-content">
                    <div className="report-header">
                      <h4>Reporte de {dailyReport.date}</h4>
                      <p>Profesor: {dailyReport.professor_name}</p>
                      <p>Total de eventos: {dailyReport.total_events}</p>
                    </div>

                    {/* Estadísticas generales */}
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-label">Total Inscritos</div>
                        <div className="stat-value">{dailyReport.total_enrolled_all_events}</div>
                      </div>
                      <div className="stat-card present">
                        <div className="stat-label">✅ Presentes</div>
                        <div className="stat-value">{dailyReport.total_present_all_events}</div>
                      </div>
                      <div className="stat-card late">
                        <div className="stat-label">⏰ Tardíos</div>
                        <div className="stat-value">{dailyReport.total_late_all_events}</div>
                      </div>
                      <div className="stat-card absent">
                        <div className="stat-label">❌ Ausentes</div>
                        <div className="stat-value">{dailyReport.total_absent_all_events}</div>
                      </div>
                      <div className="stat-card scanned">
                        <div className="stat-label">📱 Escaneados</div>
                        <div className="stat-value">{dailyReport.total_scanned_all_events}</div>
                      </div>
                      <div className="stat-card attendance">
                        <div className="stat-label">Asistencia %</div>
                        <div className="stat-value">{dailyReport.attendance_percentage}%</div>
                      </div>
                    </div>

                    {/* Eventos */}
                    <div className="events-list">
                      <h5>Eventos del día ({dailyReport.events.length})</h5>
                      {dailyReport.events.map((event, eventIdx) => (
                        <div key={event.event_id} className="event-item">
                          <div className="event-header">
                            <h6>{event.title}</h6>
                            <span className="course-label">{event.course_name} - {event.course_parallel}</span>
                            <span className={`event-status ${event.is_active ? 'active' : 'inactive'}`}>
                              {event.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className="event-times">
                            <p>Inicio: {event.start_time} | Presente hasta: {event.present_until} | Tarde hasta: {event.late_until}</p>
                          </div>

                          <div className="event-stats">
                            <span>Total inscritos: {event.total_enrolled}</span>
                            <span className="present">Presentes: {event.present_count}</span>
                            <span className="late">Tardíos: {event.late_count}</span>
                            <span className="absent">Ausentes: {event.absent_count}</span>
                            <span className="scanned">Escaneados: {event.scanned_count}</span>
                          </div>

                          {/* Tabla de asistencia */}
                          <div className="attendance-table-container">
                            <table className="attendance-table">
                              <thead>
                                <tr>
                                  <th>Estudiante</th>
                                  <th>Código</th>
                                  <th>C.I.</th>
                                  <th>Estado</th>
                                  <th>Hora</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.attendance_records.map((record, idx) => (
                                  <tr key={`${event.event_id}-${record.student_id}-${idx}`} className={`status-${record.status.toLowerCase()}`}>
                                    <td className="student-name">{record.student_name}</td>
                                    <td>{record.student_code}</td>
                                    <td>{record.ci}</td>
                                    <td>
                                      <span className={`status-badge ${record.status.toLowerCase()}`}>
                                        {record.status === 'NO_REGISTRADO' ? '❓' : ''}{record.status === 'PRESENT' ? '✅' : ''}{record.status === 'LATE' ? '⏰' : ''}{record.status === 'ABSENT' ? '❌' : ''}
                                        {' '}
                                        {record.status}
                                      </span>
                                    </td>
                                    <td className="scanned-time">{record.scanned_at ? new Date(record.scanned_at).toLocaleTimeString() : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            </>
          ) : null}
