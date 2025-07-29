import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, CircularProgress, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AudioBasedAnalysis, TextBasedAnalysis } from '../../../server/src/utils/analysisTypes';

// Nested property keys for each top-level property in AudioBasedAnalysis
export const AUDIO_ANALYSIS_STRUCTURE: [keyof AudioBasedAnalysis, (string | (string | string[])[])[]][] = [
  ['tone', ['score', 'description', 'suggestions']],
  ['confidence', ['level', 'evidence']],
  ['clarity', ['score', 'description', 'suggestions']],
  ['fillerWords', ['count', 'examples']],
  ['jargon', ['count', 'examples', 'severity']],
  ['structure', ['score', 'description', 'suggestions']],
  ['persuasiveness', [
    'score',
    'description',
    'suggestions',
    ['callToAction', ['present', 'strength', 'feedback']]
  ]],
  ['engagement', ['score', 'vocal_variety', 'energy_level']],
  ['credibility', ['score', 'evidence', 'weaknesses']],
  ['audienceFit', ['score', 'description', 'issues', 'suggestions']],
  ['originality', ['score', 'description', 'comparisons', 'suggestions']],
  ['emotionalImpact', ['score', 'triggers', 'notes']],
  ['improvedVersion', []],
  ['overallScore', []],
];

// Nested property keys for each top-level property in TextBasedAnalysis
export const TEXT_ANALYSIS_STRUCTURE: [keyof TextBasedAnalysis, (string | (string | string[])[])[]][] = [
  ['tone', ['score', 'description', 'suggestions']],
  ['clarity', ['score', 'description', 'suggestions']],
  ['jargon', ['count', 'examples', 'severity']],
  ['structure', ['score', 'description', 'suggestions']],
  ['persuasiveness', [
    'score',
    'description',
    'suggestions',
    ['callToAction', ['present', 'strength', 'feedback']]
  ]],
  ['memorability', ['score', 'description', 'suggestions']],
  ['credibility', ['score', 'evidence', 'weaknesses']],
  ['audienceFit', ['score', 'description', 'issues', 'suggestions']],
  ['originality', ['score', 'description', 'comparisons', 'suggestions']],
  ['emotionalImpact', ['score', 'triggers', 'notes']],
  ['improvedVersion', []],
  ['overallScore', []],
];

// List of top-level properties for each analysis type
export const AUDIO_ANALYSIS_KEYS: (keyof AudioBasedAnalysis)[] = [
  'tone',
  'confidence',
  'clarity',
  'fillerWords',
  'jargon',
  'structure',
  'persuasiveness',
  'engagement',
  'credibility',
  'audienceFit',
  'originality',
  'emotionalImpact',
  'improvedVersion',
  'overallScore',
];

export const TEXT_ANALYSIS_KEYS: (keyof TextBasedAnalysis)[] = [
  'tone',
  'clarity',
  'jargon',
  'structure',
  'persuasiveness',
  'memorability',
  'credibility',
  'audienceFit',
  'originality',
  'emotionalImpact',
  'improvedVersion',
  'overallScore',
];


type AnalysisResultProps = {
  analysis: AudioBasedAnalysis | TextBasedAnalysis;
  mode: 'audio' | 'text';
  audioTranscript?: string | null;
  audioFeatures?: any;
  getScoreColor?: (score: number) => string;
  historyMeta?: {
    displayDate: string;
    inputType: 'text' | 'audio';
    pitchText: string;
    score: number;
  };
  originalText?: string; // For text-based analysis
};

// Helper to render nested properties recursively
const renderProps = (obj: any, structure: (string | (string | string[])[])[]) => {
  // Helper function to format property names to human-readable text
  const formatPropertyName = (propName: string): string => {
    const propertyMap: { [key: string]: string } = {
      'description': 'Description',
      'suggestions': 'Suggestions',
      'level': 'Level',
      'evidence': 'Evidence',
      'examples': 'Examples',
      'severity': 'Severity',
      'vocal_variety': 'Vocal Variety',
      'energy_level': 'Energy Level',
      'weaknesses': 'Weaknesses',
      'issues': 'Issues',
      'comparisons': 'Comparisons',
      'triggers': 'Triggers',
      'notes': 'Notes',
      'callToAction': 'Call to Action',
      'present': 'Present',
      'strength': 'Strength',
      'feedback': 'Feedback'
    };
    
    return propertyMap[propName] || propName;
  };

  // Helper function to get level color for vocal_variety and energy_level
  const getLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'high': return '#4caf50'; // Green
      case 'medium': return '#ff9800'; // Orange
      case 'low': return '#f44336'; // Red
      default: return '#757575'; // Gray for unknown
    }
  };

  // If structure is empty, this is a primitive value - render it directly
  if (structure.length === 0) {
    return (
      <div style={{ padding: '8px 0', color: '#fff' }}>
        {obj !== null && obj !== undefined ? String(obj) : 'N/A'}
      </div>
    );
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 16 }}>
      {structure.map((key, idx) => {
        if (Array.isArray(key)) {
          // Nested property: [propName, [subProps]]
          const [nestedKey, nestedProps] = key as [string, string[]];
          
          // Special handling for callToAction
          if (nestedKey === 'callToAction' && obj && obj[nestedKey]) {
            const callToActionData = obj[nestedKey];
            if (callToActionData.present === true && callToActionData.strength) {
              return (
                <li key={nestedKey} style={{ marginBottom: 4 }}>
                  <strong>{formatPropertyName(nestedKey)}:</strong>
                  <div style={{ marginTop: 4 }}>
                    <div style={{ marginBottom: 2 }}>There is a {callToActionData.strength} call to action.</div>
                    {callToActionData.feedback && (
                      <div style={{ marginBottom: 2 }}><strong>Feedback:</strong> {callToActionData.feedback}</div>
                    )}
                  </div>
                </li>
              );
            } else if (callToActionData.present === false) {
              return (
                <li key={nestedKey} style={{ marginBottom: 4 }}>
                  <strong>{formatPropertyName(nestedKey)}:</strong>
                  <div style={{ marginTop: 4 }}>
                    <div style={{ marginBottom: 2 }}>There is no call to action.</div>
                    {callToActionData.feedback && (
                      <div style={{ marginBottom: 2 }}><strong>Feedback:</strong> {callToActionData.feedback}</div>
                    )}
                  </div>
                </li>
              );
            }
          }
          
          return (
            <li key={nestedKey} style={{ marginBottom: 4 }}>
              <strong>{formatPropertyName(nestedKey)}:</strong>
              {obj && obj[nestedKey] ? renderProps(obj[nestedKey], nestedProps) : ' N/A'}
            </li>
          );
        } else {
          // Skip rendering 'score', 'count', 'severity', and 'level' properties since they're already shown in badges
          if (key === 'score' || key === 'count' || key === 'severity' || key === 'level') {
            return null;
          }
          
          // Render examples as badges
          if (key === 'examples' && Array.isArray(obj?.[key])) {
            return (
              <li key={key as string} style={{ marginBottom: 0, listStyle: 'none', marginLeft: '-16px' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {obj[key].map((example: string, index: number) => (
                    <Chip
                      key={index}
                      label={example}
                      size="small"
                      variant="outlined"
                      sx={{
                        backgroundColor: 'rgba(97, 218, 251, 0.1)',
                        borderColor: '#61dafb',
                        color: '#61dafb',
                        fontSize: '0.7rem'
                      }}
                    />
                  ))}
                </Box>
              </li>
            );
          }

          // Render vocal_variety and energy_level as badges for engagement section
          if ((key === 'vocal_variety' || key === 'energy_level') && obj?.[key]) {
            return (
              <li key={key as string} style={{ marginBottom: 4 }}>
                <strong>{formatPropertyName(key)}:</strong>
                <Box sx={{ display: 'inline-flex', marginLeft: 1 }}>
                  <Chip
                    label={obj[key]}
                    size="small"
                    sx={{
                      backgroundColor: getLevelColor(obj[key]),
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase'
                    }}
                  />
                </Box>
              </li>
            );
          }
          
          return (
            <li key={key as string} style={{ marginBottom: 4 }}>
              <strong>{formatPropertyName(key)}:</strong>
              <div style={{ marginTop: 4 }}>
                {Array.isArray(obj?.[key]) ? (
                  obj[key].map((item: string, index: number) => (
                    <div key={index} style={{ marginBottom: 2 }}>{item}</div>
                  ))
                ) : (
                  obj?.[key] ? (
                    String(obj[key]).split(/[.!?]+/).filter(sentence => sentence.trim()).map((sentence: string, index: number) => (
                      <div key={index} style={{ marginBottom: 2 }}>{sentence.trim()}.</div>
                    ))
                  ) : (
                    <div>N/A</div>
                  )
                )}
              </div>
            </li>
          );
        }
      })}
    </ul>
  );
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, mode, audioTranscript, originalText, historyMeta }) => {
  const overallScore = (analysis as any).overallScore || 0;
  
  // Get the original text/transcript
  const originalContent = mode === 'audio' 
    ? audioTranscript 
    : (originalText || historyMeta?.pitchText);
  
  // Helper function to convert camelCase to human-readable text
  const formatSectionTitle = (sectionName: string): string => {
    const titleMap: { [key: string]: string } = {
      'tone': 'Tone',
      'confidence': 'Confidence',
      'clarity': 'Clarity',
      'fillerWords': 'Filler Words',
      'jargon': 'Jargon',
      'structure': 'Structure',
      'persuasiveness': 'Persuasiveness',
      'engagement': 'Engagement',
      'credibility': 'Credibility',
      'audienceFit': 'Audience Fit',
      'originality': 'Originality',
      'emotionalImpact': 'Emotional Impact',
      'memorability': 'Memorability',
      'improvedVersion': 'Improved Version'
    };
    
    return titleMap[sectionName] || sectionName;
  };
  
  // Helper function to get score from a section
  const getSectionScore = (sectionData: any): number | null => {
    if (sectionData && typeof sectionData.score === 'number') {
      return sectionData.score;
    }
    return null;
  };

  // Helper function to get count from a section (for fillerWords and jargon)
  const getSectionCount = (sectionData: any): number | null => {
    if (sectionData && typeof sectionData.count === 'number') {
      return sectionData.count;
    }
    return null;
  };

  // Helper function to get severity from a section (for jargon)
  const getSectionSeverity = (sectionData: any): string | null => {
    if (sectionData && typeof sectionData.severity === 'string') {
      return sectionData.severity;
    }
    return null;
  };

  // Helper function to get confidence level from a section
  const getSectionLevel = (sectionData: any): string | null => {
    if (sectionData && typeof sectionData.level === 'string') {
      return sectionData.level;
    }
    return null;
  };

  // Helper function to get score color
  const getScoreColor = (score: number): string => {
    if (score >= 75) return '#4caf50'; // Green
    if (score >= 50) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  // Helper function to get count color (lower is better for filler words and jargon)
  const getCountColor = (count: number): string => {
    if (count <= 2) return '#4caf50'; // Green - good
    if (count <= 5) return '#ff9800'; // Orange - moderate
    return '#f44336'; // Red - high
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'low': return '#4caf50'; // Green
      case 'medium': return '#ff9800'; // Orange
      case 'high': return '#f44336'; // Red
      default: return '#757575'; // Gray for unknown
    }
  };

  // Helper function to get confidence level color
  const getLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'high': return '#4caf50'; // Green
      case 'medium': return '#ff9800'; // Orange
      case 'low': return '#f44336'; // Red
      default: return '#757575'; // Gray for unknown
    }
  };
  
  // Get the appropriate structure and filter out overallScore
  let sectionsWithoutOverallScore: typeof AUDIO_ANALYSIS_STRUCTURE | typeof TEXT_ANALYSIS_STRUCTURE;
  
  if (mode === 'audio') {
    sectionsWithoutOverallScore = AUDIO_ANALYSIS_STRUCTURE.filter(([section]) => section !== 'overallScore');
  } else {
    sectionsWithoutOverallScore = TEXT_ANALYSIS_STRUCTURE.filter(([section]) => section !== 'overallScore');
  }
  
  return (
    <div>
      {/* Overall Score Circle at the top */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginBottom: 3,
          position: 'relative'
        }}
      >
        <CircularProgress
          variant="determinate"
          value={overallScore}
          size={120}
          thickness={6}
          sx={{
            color: getScoreColor(overallScore),
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" component="div" sx={{ color: '#fff', fontWeight: 'bold' }}>
            {overallScore}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            / 100
          </Typography>
        </Box>
      </Box>

      {/* Original Content Section */}
      {originalContent && (
        <Box sx={{ marginBottom: 1, backgroundColor: '#23233a', padding: 2, borderRadius: '15px' }}>
          <Typography variant="h6" sx={{ color: '#61dafb', marginBottom: 1 }}>
            {mode === 'audio' ? 'Transcript' : 'Original Text'}
          </Typography>
          <Typography sx={{ color: '#fff', lineHeight: 1.6 }}>
            {originalContent}
          </Typography>
        </Box>
      )}

      {/* Accordion sections for everything except overallScore - 2 column grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: 1,
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr'
        }
      }}>
        {sectionsWithoutOverallScore.map(([section, props], index) => {
          const sectionData = (analysis as any)[section];
          const score = getSectionScore(sectionData);
          const count = getSectionCount(sectionData);
          const severity = getSectionSeverity(sectionData);
          const level = getSectionLevel(sectionData);
          
          // Disable expansion for fillerWords and jargon when count is 0
          const isExpandable = !((section === 'fillerWords' || section === 'jargon') && count === 0);
          
          // Check if this is the last item and there's an odd number of items
          const isLastOddItem = index === sectionsWithoutOverallScore.length - 1 && sectionsWithoutOverallScore.length % 2 === 1;
          
          return (
            <Accordion 
              key={section} 
              sx={{ 
                marginBottom: 0, 
                backgroundColor: '#23233a', 
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0,
                  // Prevent grid layout issues when expanded
                  alignSelf: 'start'
                },
                // Span 2 columns if it's the last odd item
                gridColumn: isLastOddItem ? 'span 2' : 'auto',
                '@media (max-width: 768px)': {
                  gridColumn: 'auto'
                },
                // Ensure consistent alignment
                alignSelf: 'start'
              }}
            >
              <AccordionSummary 
                expandIcon={isExpandable ? <ExpandMoreIcon sx={{ color: '#61dafb' }} /> : null}
                sx={{ 
                  backgroundColor: '#2d2d44',
                cursor: isExpandable ? 'pointer' : 'default',
                minHeight: '64px',
                '&.Mui-expanded': {
                  minHeight: '64px'
                },
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                  '&.Mui-expanded': {
                    margin: '12px 0'
                  }
                }
              }}
              onClick={isExpandable ? undefined : (e) => e.preventDefault()}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginRight: 2 }}>
                <Typography variant="h6" sx={{ color: '#61dafb' }}>
                  {formatSectionTitle(section)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {score !== null && (
                    <Chip 
                      label={`${score}/100`}
                      size="small"
                      sx={{ 
                        backgroundColor: getScoreColor(score),
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                  {count !== null && (
                    <Chip 
                      label={`${count} ${count === 1 ? 'term' : 'terms'}`}
                      size="small"
                      sx={{ 
                        backgroundColor: getCountColor(count),
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                  {severity !== null && (
                    <Chip 
                      label={severity}
                      size="small"
                      sx={{ 
                        backgroundColor: getSeverityColor(severity),
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}
                    />
                  )}
                  {level !== null && (
                    <Chip 
                      label={level}
                      size="small"
                      sx={{ 
                        backgroundColor: getLevelColor(level),
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}
                    />
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            {isExpandable && (
              <AccordionDetails sx={{ backgroundColor: '#23233a', padding: 2 }}>
                {renderProps(sectionData, props)}
              </AccordionDetails>
            )}
          </Accordion>
        );
      })}
      </Box>
    </div>
  );
};

export default AnalysisResult;
