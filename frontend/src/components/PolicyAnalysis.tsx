import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import policyService from "../services/policyService";
import type { AnalysisResultForUI } from '../types/api'
import type { ApiError } from '../services/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Shield,
  BarChart,
  Download,
  ArrowLeft,
  Lock,
  Star,
} from "lucide-react";

type AnalysisStep = "upload" | "options" | "analyzing" | "results";

export default function PolicyAnalysis() {
  const { isAuthenticated, isPro, loading } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<AnalysisStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<"basic" | "ai">("basic");
  const [, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultForUI | null>(null)
  const [originalComplianceResult, setOriginalComplianceResult] = useState<any>(null)
  const [currentAnalysisMode, setCurrentAnalysisMode] = useState<string>('fast')
  const [dragOver, setDragOver] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCurrentStep("options");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file && isValidFileType(file)) {
      handleFileSelect(file);
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/html",
    ];
    return validTypes.includes(file.type);
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setCurrentStep("analyzing");
    setAnalysisProgress(0);
    setAnalysisMessage('Starting analysis...');
    setAnalysisError(null);

    try {
      // Get the appropriate analysis mode based on the selected type
      const analysisMode = policyService.getAnalysisModeFromType(analysisType)
      setCurrentAnalysisMode(analysisMode)

      // Use streaming analysis for better user experience
      const result = await policyService.analyzePolicyStreaming(
        selectedFile,
        analysisMode,
        (progress, message) => {
          setAnalysisProgress(progress)
          if (message) {
            setAnalysisMessage(message)
          }
        }
      )

      // Store the original result for report generation
      setOriginalComplianceResult(result)

      // Transform the result for UI display
      const uiResult = policyService.transformResultForUI(
        result,
        selectedFile.name,
        analysisMode
      )

      setAnalysisProgress(100)
      setAnalysisResult(uiResult)
      setCurrentStep('results')
    } catch (error) {
      console.error("Analysis failed:", error);
      const apiError = error as ApiError;

      // Handle specific API errors
      if (apiError.status === 403 && apiError.details?.upgrade_required) {
        setAnalysisError(
          `${apiError.message}. You requested ${apiError.details.requested_mode} mode, but only ${apiError.details.available_mode} mode is available on your plan.`
        );
      } else {
        setAnalysisError(
          apiError.message || "Analysis failed. Please try again."
        );
      }

      // Reset to options step so user can try again or change settings
      setCurrentStep("options");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setAnalysisResult(null)
    setOriginalComplianceResult(null)
    setCurrentAnalysisMode('fast')
    setAnalysisProgress(0)
    setAnalysisMessage('')
    setIsAnalyzing(false)
    setAnalysisError(null)
    setIsGeneratingReport(false)
  }

  const handleDownloadReport = async () => {
    if (!originalComplianceResult || !analysisResult) return

    setIsGeneratingReport(true)
    try {
      // Generate the report
      const reportInfo = await policyService.generateVerificationReport(
        originalComplianceResult,
        analysisResult.filename,
        currentAnalysisMode as any
      )

      // Download the report
      await policyService.downloadReport(reportInfo.filename)
    } catch (error) {
      console.error('Report generation/download failed:', error)
      const apiError = error as ApiError
      setAnalysisError(`Failed to generate report: ${apiError.message || 'Unknown error'}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Policy Analysis
          </h1>
          <p className="text-gray-600">
            Upload and analyze your privacy policy for GDPR compliance
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: "upload", label: "Upload", icon: Upload },
              { step: "options", label: "Options", icon: Shield },
              { step: "analyzing", label: "Analysis", icon: Clock },
              { step: "results", label: "Results", icon: BarChart },
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep === step ||
                    (["options", "analyzing", "results"].indexOf(currentStep) >=
                      ["options", "analyzing", "results"].indexOf(step) &&
                      currentStep !== "upload")
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">
                  {label}
                </span>
                {index < 3 && (
                  <div
                    className={`w-16 h-0.5 ml-4 transition-colors ${
                      ["options", "analyzing", "results"].indexOf(currentStep) >
                        index - 1 && currentStep !== "upload"
                        ? "bg-blue-600"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === "upload" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">
                Upload Privacy Policy
              </CardTitle>
              <CardDescription className="text-center">
                Upload your privacy policy document for GDPR compliance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your file here, or click to browse
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports PDF, DOCX, TXT, and HTML files up to 10MB
                </p>
                <Button
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  variant="outline"
                >
                  Choose File
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.html"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && isValidFileType(file)) {
                      handleFileSelect(file);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "options" && selectedFile && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Selected File */}
            <Card>
              <CardHeader>
                <CardTitle>Selected File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Options */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Options</CardTitle>
                <CardDescription>
                  Choose the type of analysis for your privacy policy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Analysis */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    analysisType === "basic"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setAnalysisType("basic");
                    setAnalysisError(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="font-medium">Basic Analysis</h3>
                        <p className="text-sm text-gray-600">
                          Rule-based compliance checking with essential
                          recommendations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        FREE
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          analysisType === "basic"
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div
                  className={`border rounded-lg p-4 transition-colors ${
                    !isPro
                      ? "opacity-60 cursor-not-allowed border-gray-200"
                      : analysisType === "ai"
                      ? "border-blue-500 bg-blue-50 cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isPro) {
                      setAnalysisType("ai");
                      setAnalysisError(null);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap
                        className={`h-6 w-6 ${
                          isPro ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          AI-Powered Analysis
                          {!isPro && <Lock className="h-4 w-4 text-gray-400" />}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Advanced AI analysis with confidence scores and
                          detailed insights
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        PRO
                      </span>
                      {isPro && (
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            analysisType === "ai"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                  {!isPro && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {analysisError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">Analysis Failed</p>
                  </div>
                  <p className="text-red-700 mt-2">{analysisError}</p>
                </CardContent>
              </Card>
            )}

            {/* Start Analysis */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("upload")}
              >
                Change File
              </Button>
              <Button
                onClick={startAnalysis}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Analysis
              </Button>
            </div>
          </div>
        )}

        {currentStep === "analyzing" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Analyzing Policy</CardTitle>
              <CardDescription className="text-center">
                {analysisType === "ai"
                  ? "AI is performing deep analysis of your privacy policy..."
                  : "Performing rule-based compliance analysis..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="w-full" />
              </div>

              <div className="text-center text-sm text-gray-600">
                <p className="font-medium text-blue-600 mb-2">{analysisMessage}</p>
                <p>This may take a few moments...</p>
                <p className="mt-1">Filename: {selectedFile?.name}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "results" && analysisResult && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Results Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      Analysis Complete
                    </CardTitle>
                    <CardDescription>
                      Analysis completed for {analysisResult.filename}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(
                        analysisResult.score
                      )}`}
                    >
                      {analysisResult.score}/100
                    </div>
                    <p className="text-sm text-gray-600">Compliance Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {analysisResult.timestamp.toLocaleString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        analysisResult.analysisType === "ai"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {analysisResult.analysisType === "ai"
                        ? "AI Analysis"
                        : "Basic Analysis"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {analysisResult.analysisType === 'ai' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadReport}
                        disabled={isGeneratingReport}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isGeneratingReport ? 'Generating...' : 'Download Report'}
                      </Button>
                    )}
                    <Button onClick={resetAnalysis} variant="outline" size="sm">
                      New Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Violations */}
            <Card>
              <CardHeader>
                <CardTitle>Detected Violations</CardTitle>
                <CardDescription>
                  Issues found in your privacy policy that require attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.violations.map((violation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          <h3 className="font-medium">{violation.category}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(
                              violation.severity
                            )}`}
                          >
                            {violation.severity.toUpperCase()}
                          </span>
                          {violation.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(violation.confidence * 100)}%
                              confidence
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">
                        {violation.description}
                      </p>
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">
                          <strong>Recommendation:</strong>{" "}
                          {violation.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>General Recommendations</CardTitle>
                <CardDescription>
                  Overall suggestions to improve GDPR compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.recommendations.map(
                    (recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <p className="text-gray-700">
                          {typeof recommendation === "string"
                            ? recommendation
                            : recommendation.suggestion}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
