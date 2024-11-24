import React, { useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Box, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { styled } from '@mui/material/styles';
import LoadingButton from '@mui/lab/LoadingButton';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const AnalysisChart = () => {
    const [data, setData] = useState(null);
    const [file, setFile] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setLoading(true);
    };

    const fetchAnalysis = async () => {
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('http://54.172.105.83:8000/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const transformedData = {
                ...response.data,
                current_semester_analysis: response.data.current_semester_analysis.map(item => ({
                    ...item,
                    subjects: item.subjects.map(subject => ({
                        ...subject,
                        compound_average: (subject.compound_average + 1) * 50,
                    })),
                })),
                previous_semester_analysis: response.data.previous_semester_analysis.map(item => ({
                    ...item,
                    subjects: item.subjects.map(subject => ({
                        ...subject,
                        compound_average: (subject.compound_average + 1) * 50,
                    })),
                })),
            };

            setData(transformedData);
        } catch (error) {
            console.error('Error fetching analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (file) {
            fetchAnalysis();
        }
    }, [file]);

    const getCurrentSemesterData = () => {
        if (selectedTeacher) {
            const teacherData = data.current_semester_analysis.find(item => item.teacher === selectedTeacher);
            return teacherData ? teacherData.subjects.map(subject => subject.compound_average) : [];
        }
        return data.current_semester_analysis.map(item => item.compound_average);
    };

    const getPreviousSemesterData = () => {
        if (selectedTeacher) {
            const teacherData = data.previous_semester_analysis.find(item => item.teacher === selectedTeacher);
            return teacherData ? teacherData.subjects.map(subject => subject.compound_average) : [];
        }
        return data.previous_semester_analysis.map(item => item.compound_average);
    };

    const chartData = data ? {
        labels: selectedTeacher
            ? data.current_semester_analysis.find(item => item.teacher === selectedTeacher)?.subjects.map(subject => subject.subject) || []
            : data.current_semester_analysis.map(item => item.teacher),
        datasets: [
            {
                label: 'Promedio de Sentimientos (Semestre Actual)',
                data: getCurrentSemesterData(),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: 'Promedio de Sentimientos (Semestre Anterior)',
                data: getPreviousSemesterData(),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
        ],
    } : null;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw',
                flexDirection: 'column',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                padding: 2,
            }}
        >
            {!data ? (
                <LoadingButton
                    component="label"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    loading={loading}
                    sx={{ mt: 4 }}
                    size="large"
                >
                    Subir Archivo
                    <VisuallyHiddenInput
                        type="file"
                        multiple
                        onChange={(e) => handleFileChange(e)}
                    />
                </LoadingButton>
            ) : (
                <>
                    <Box sx={{ width: '80%', maxWidth: 800 }}>
                        <Bar data={chartData} />
                    </Box>

                    <FormControl sx={{ my: 3, width: '300px' }}>
                        <InputLabel>Selecciona un Profesor</InputLabel>
                        <Select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            label="Selecciona un Profesor"
                        >
                            <MenuItem value="">Ver todos los promedios</MenuItem>
                            {data.current_semester_analysis.map(item => (
                                <MenuItem key={item.teacher} value={item.teacher}>{item.teacher}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </>
            )}
        </Box>
    );
};

export default AnalysisChart;
