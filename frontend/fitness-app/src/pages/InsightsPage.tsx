import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useGetCourseProfitByWeek } from '../hooks/courses/useGetCourseProfitByWeek.tsx';
import { useGetCourseProfitByMonth } from '../hooks/courses/useGetCourseProfitByMonth.tsx';
import { useGetCourseProfitByYear } from '../hooks/courses/useGetCourseProfitByYear.tsx';
import Footer from "../components/Footer.tsx";
import {useGetSubProfitByWeek} from "../hooks/subscriptions/useGetSubProfitByWeek.tsx";
import {useGetSubProfitByMonth} from "../hooks/subscriptions/useGetSubProfitByMonth.tsx";
import {useGetSubProfitByYear} from "../hooks/subscriptions/useGetSubProfitByYear.tsx";

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

const BLUE   = '#1a73e8';
const ORANGE = '#f5a623';

const stackedBarOpt = (title: string, labels: string[], courseVals: number[], subVals: number[]) => ({
  title: { text: title, left: 'left', textStyle: { fontSize: 14, fontWeight: 600, color: '#333' } },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const corso = params.find((p: any) => p.seriesName === 'Corsi');
      const abb   = params.find((p: any) => p.seriesName === 'Abbonamenti');
      const tot   = (corso?.value ?? 0) + (abb?.value ?? 0);
      return `${params[0].name}<br/>Corsi: € ${Number(corso?.value ?? 0).toFixed(2)}<br/>Abbonamenti: € ${Number(abb?.value ?? 0).toFixed(2)}<br/><b>Totale: € ${tot.toFixed(2)}</b>`;
    },
  },
  legend: { top: 28, right: 8, textStyle: { fontSize: 11, color: '#555' } },
  grid: { left: 8, right: 8, bottom: 8, top: 60, containLabel: true },
  xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e0e0e0' } }, axisTick: { show: false }, axisLabel: { color: '#888', fontSize: 11 } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#888', fontSize: 11, formatter: (v: number) => `€${v}` } },
  series: [
    { name: 'Corsi',        type: 'bar', stack: 'profit', data: courseVals, barMaxWidth: 40, itemStyle: { color: BLUE,   borderRadius: [0, 0, 0, 0] } },
    { name: 'Abbonamenti',  type: 'bar', stack: 'profit', data: subVals,   barMaxWidth: 40, itemStyle: { color: ORANGE, borderRadius: [4, 4, 0, 0] } },
  ],
});

const stackedLineOpt = (title: string, labels: string[], courseVals: number[], subVals: number[]) => ({
  title: { text: title, left: 'left', textStyle: { fontSize: 14, fontWeight: 600, color: '#333' } },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const corso = params.find((p: any) => p.seriesName === 'Corsi');
      const abb   = params.find((p: any) => p.seriesName === 'Abbonamenti');
      const tot   = (corso?.value ?? 0) + (abb?.value ?? 0);
      return `${params[0].name}<br/>Corsi: € ${Number(corso?.value ?? 0).toFixed(2)}<br/>Abbonamenti: € ${Number(abb?.value ?? 0).toFixed(2)}<br/><b>Totale: € ${tot.toFixed(2)}</b>`;
    },
  },
  legend: { top: 28, right: 8, textStyle: { fontSize: 11, color: '#555' } },
  grid: { left: 8, right: 8, bottom: 8, top: 60, containLabel: true },
  xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e0e0e0' } }, axisTick: { show: false }, axisLabel: { color: '#888', fontSize: 11 } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#888', fontSize: 11, formatter: (v: number) => `€${v}` } },
  series: [
    {
      name: 'Corsi', type: 'line', stack: 'profit', data: courseVals, smooth: true,
      symbol: 'circle', symbolSize: 5,
      lineStyle: { color: BLUE, width: 2 },
      itemStyle: { color: BLUE },
      areaStyle: { color: BLUE + '30' },
    },
    {
      name: 'Abbonamenti', type: 'line', stack: 'profit', data: subVals, smooth: true,
      symbol: 'circle', symbolSize: 5,
      lineStyle: { color: ORANGE, width: 2 },
      itemStyle: { color: ORANGE },
      areaStyle: { color: ORANGE + '30' },
    },
  ],
});

const donutOpt = (title: string, courseVal: number, subVal: number) => ({
  title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#333' } },
  tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: € ${Number(p.value).toFixed(2)} (${p.percent}%)` },
  legend: { bottom: 0, left: 'center', textStyle: { fontSize: 11, color: '#555' } },
  series: [{
    type: 'pie', radius: ['52%', '70%'], center: ['50%', '52%'],
    data: [
      { value: courseVal, name: 'Corsi',       itemStyle: { color: BLUE } },
      { value: subVal,    name: 'Abbonamenti', itemStyle: { color: ORANGE } },
    ],
    label: {
      show: true, position: 'center',
      formatter: () => `€ ${(courseVal + subVal).toFixed(2)}`,
      fontSize: 17, fontWeight: 700, color: '#333',
    },
  }],
});

// Utility: allinea due array per label, riempiendo con 0 i buchi
const alignByKey = (
  aArr: any[], bArr: any[],
  keyFn: (item: any) => string,
) => {
  const allKeys = Array.from(new Set([...aArr.map(keyFn), ...bArr.map(keyFn)]));
  const aMap = Object.fromEntries(aArr.map(i => [keyFn(i), i.profit]));
  const bMap = Object.fromEntries(bArr.map(i => [keyFn(i), i.profit]));
  return {
    labels:  allKeys,
    aVals:   allKeys.map(k => aMap[k] ?? 0),
    bVals:   allKeys.map(k => bMap[k] ?? 0),
  };
};

export default function InsightsPage() {
  const { loading: lwc, error: ewc, getCourseProfitWeek }  = useGetCourseProfitByWeek();
  const { loading: lmc, error: emc, getCourseProfitMonth } = useGetCourseProfitByMonth();
  const { loading: lyc, error: eyc, getCourseProfitYear }  = useGetCourseProfitByYear();

  const { loading: lws, error: ews, getSubProfitWeek }  = useGetSubProfitByWeek();
  const { loading: lms, error: ems, getSubProfitMonth } = useGetSubProfitByMonth();
  const { loading: lys, error: eys, getSubProfitYear }  = useGetSubProfitByYear();

  const [weekCourse,  setWeekCourse]  = useState<any[]>([]);
  const [monthCourse, setMonthCourse] = useState<any[]>([]);
  const [yearCourse,  setYearCourse]  = useState<any[]>([]);

  const [weekSub,  setWeekSub]  = useState<any[]>([]);
  const [monthSub, setMonthSub] = useState<any[]>([]);
  const [yearSub,  setYearSub]  = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [wc, mc, yc] = await Promise.all([getCourseProfitWeek(), getCourseProfitMonth(), getCourseProfitYear()]);
      setWeekCourse(wc?.profit_week   ?? []);
      setMonthCourse(mc?.profit_month ?? []);
      setYearCourse(yc?.profit_year   ?? []);

      const [ws, ms, ys] = await Promise.all([getSubProfitWeek(), getSubProfitMonth(), getSubProfitYear()]);
      setWeekSub(ws?.profit_week   ?? []);
      setMonthSub(ms?.profit_month ?? []);
      setYearSub(ys?.profit_year   ?? []);
    })();
  }, []);

  // Totali aggregati (corsi + abbonamenti)
  const totalWeekCourse  = useMemo(() => weekCourse.reduce((a, c)  => a + c.profit, 0), [weekCourse]);
  const totalWeekSub     = useMemo(() => weekSub.reduce((a, c)     => a + c.profit, 0), [weekSub]);
  const totalMonthCourse = useMemo(() => monthCourse.reduce((a, c) => a + c.profit, 0), [monthCourse]);
  const totalMonthSub    = useMemo(() => monthSub.reduce((a, c)    => a + c.profit, 0), [monthSub]);
  const totalYearCourse  = useMemo(() => yearCourse.reduce((a, c)  => a + c.profit, 0), [yearCourse]);
  const totalYearSub     = useMemo(() => yearSub.reduce((a, c)     => a + c.profit, 0), [yearSub]);

  const totalWeek  = totalWeekCourse  + totalWeekSub;
  const totalMonth = totalMonthCourse + totalMonthSub;
  const totalYear  = totalYearCourse  + totalYearSub;

  // Dati allineati per i grafici stacked
  const week  = useMemo(() => alignByKey(weekCourse,  weekSub,  i => toWeekdayIT(i.date)), [weekCourse, weekSub]);
  const month = useMemo(() => alignByKey(monthCourse, monthSub, i => String(i.day ?? i.date)), [monthCourse, monthSub]);
  const year  = useMemo(() => alignByKey(yearCourse,  yearSub,  i => toMonthIT(i.month)), [yearCourse, yearSub]);

  const error   = ewc || emc || eyc || ews || ems || eys;
  const loading = lwc || lmc || lyc || lws || lms || lys;

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

          {/* Charts row 1 — settimana */}
          <div className="row g-3 mb-3">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <ReactECharts style={{ height: 300 }}
                    option={stackedBarOpt('Profitti Settimanali', week.labels, week.aVals, week.bVals)} />
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <ReactECharts style={{ height: 300 }}
                    option={donutOpt('Totale Settimana', totalWeekCourse, totalWeekSub)} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts row 2 — mese e anno */}
          <div className="row g-3">
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <ReactECharts style={{ height: 280 }}
                    option={stackedLineOpt('Profitti Mensili', month.labels, month.aVals, month.bVals)} />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <ReactECharts style={{ height: 280 }}
                    option={stackedBarOpt('Profitto Annuale', year.labels, year.aVals, year.bVals)} />
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