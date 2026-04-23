import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useGetProfitByWeek } from '../hooks/courses/useGetProfitByWeek.tsx';
import { useGetProfitByMonth } from '../hooks/courses/useGetProfitByMonth.tsx';
import { useGetProfitByYear } from '../hooks/courses/useGetProfitByYear.tsx';
import Footer from "../components/Footer.tsx";

const DAYS_IT   = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTHS_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const toWeekdayIT = (dateStr: string) => {
  const d = new Date(dateStr);
  return DAYS_IT[(d.getDay() + 6) % 7];
};

const toMonthIT = (val: string | number) => {
  const n = typeof val === 'number' ? val : parseInt(String(val), 10);
  if (!isNaN(n) && n >= 1 && n <= 12) return MONTHS_IT[n - 1];
  if (typeof val === 'string' && val.includes('-')) return MONTHS_IT[parseInt(val.split('-')[1], 10) - 1] ?? val;
  return String(val);
};

const BLUE = '#1a73e8';

const barOpt = (title: string, labels: string[], values: number[]) => ({
  title: { text: title, left: 'left', textStyle: { fontSize: 14, fontWeight: 600, color: '#333' } },
  tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: € ${Number(p[0].value).toFixed(2)}` },
  grid: { left: 8, right: 8, bottom: 8, top: 44, containLabel: true },
  xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e0e0e0' } }, axisTick: { show: false }, axisLabel: { color: '#888', fontSize: 11 } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#888', fontSize: 11 } },
  series: [{ type: 'bar', data: values, barMaxWidth: 40, itemStyle: { color: BLUE, borderRadius: [4, 4, 0, 0] } }],
});

const lineOpt = (title: string, labels: string[], values: number[]) => ({
  title: { text: title, left: 'left', textStyle: { fontSize: 14, fontWeight: 600, color: '#333' } },
  tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: € ${Number(p[0].value).toFixed(2)}` },
  grid: { left: 8, right: 8, bottom: 8, top: 44, containLabel: true },
  xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e0e0e0' } }, axisTick: { show: false }, axisLabel: { color: '#888', fontSize: 11 } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#888', fontSize: 11 } },
  series: [{ type: 'line', data: values, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { color: BLUE, width: 2 }, itemStyle: { color: BLUE }, areaStyle: { color: BLUE + '18' } }],
});

const donutOpt = (title: string, value: number) => ({
  title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#333' } },
  tooltip: { trigger: 'item',  formatter: (p: any) => `${p.name}: € ${Number(p.value).toFixed(2)}` },
  series: [{
    type: 'pie', radius: ['52%', '70%'], center: ['50%', '57%'],
    data: [{ value, name: 'Profitto' }],
    label: { show: true, position: 'center', formatter: () => `€ ${value.toFixed(2)}`, fontSize: 18, fontWeight: 700, color: '#333' },
    itemStyle: { color: BLUE },
  }],
});

export default function InsightsPage() {
  const { loading: lw, error: ew, getProfitWeek }  = useGetProfitByWeek();
  const { loading: lm, error: em, getProfitMonth } = useGetProfitByMonth();
  const { loading: ly, error: ey, getProfitYear }  = useGetProfitByYear();

  const [week,  setWeek]  = useState<any[]>([]);
  const [month, setMonth] = useState<any[]>([]);
  const [year,  setYear]  = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [w, m, y] = await Promise.all([getProfitWeek(), getProfitMonth(), getProfitYear()]);
      setWeek(w?.profit_week   ?? []);
      setMonth(m?.profit_month ?? []);
      setYear(y?.profit_year   ?? []);
    })();
  }, []);

  const totalWeek  = useMemo(() => week.reduce((a, c)  => a + c.profit, 0), [week]);
  const totalMonth = useMemo(() => month.reduce((a, c) => a + c.profit, 0), [month]);
  const totalYear  = useMemo(() => year.reduce((a, c)  => a + c.profit, 0), [year]);

  const error   = ew || em || ey;
  const loading = lw || lm || ly;

  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-grow-1">
        <div className="container py-4">
          <h1 className="h3 mb-1">Statistiche Profitti</h1>
          <p className="text-muted mb-4">Panoramica dei guadagni per periodo</p>

          {error   && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="alert alert-info">Caricamento dati...</div>}

          {/* KPI cards */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Settimana', value: totalWeek },
              { label: 'Mese',      value: totalMonth },
              { label: 'Anno',      value: totalYear },
            ].map(({ label, value }) => (
              <div className="col-md-4" key={label}>
                <div className="card shadow-sm border-0 rounded-3">
                  <div className="card-body">
                    <p className="text-muted small mb-1">{label}</p>
                    <div className="h4 mb-0 fw-bold" style={{ color: BLUE }}>€ {value.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="row g-3 mb-3">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <ReactECharts style={{ height: 300 }} option={barOpt('Profitti Settimanali', week.map(i => toWeekdayIT(i.date)), week.map(i => i.profit))} />
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <ReactECharts style={{ height: 300 }} option={donutOpt('Totale Settimana', totalWeek)} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="row g-3">
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <ReactECharts style={{ height: 280 }} option={lineOpt('Profitti Mensili', month.map(i => i.day ?? i.date), month.map(i => i.profit))} />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <ReactECharts style={{ height: 280 }} option={barOpt('Profitto Annuale', year.map(i => toMonthIT(i.month)), year.map(i => i.profit))} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer/>
    </div>
  );
}