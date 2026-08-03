import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  TextField,
} from "@mui/material";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { uploadDocuments } from "../../api/uploadApi";
import { validateApprover } from "../../api/approverApi";
import { clearUserSession, getStoredUser } from "../../auth/session";

const APPROVAL_BOX_FIELDS = [
  "Signature",
  "Approved By",
  "Approved On",
  "Status",
];

function UserDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [documents, setDocuments] = useState([
    {
      file: null,
      previewUrl: "",
      approvers: [{ email: "" }],
      annotations: [],
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragGhostPosition, setDragGhostPosition] = useState({ x: 0, y: 0 });
  const [isStatusPlacedOnPreview, setIsStatusPlacedOnPreview] = useState(false);
  const [statusPlacement, setStatusPlacement] = useState({ x: 16, y: 16 });
  const [statusSize, setStatusSize] = useState({ width: 240, height: 156 });
  const [dragSource, setDragSource] = useState("side");
  const previewContainerRef = useRef(null);
  const previewRefs = useRef([]);
  const [previewDims, setPreviewDims] = useState([]);
  const [draggingDocIndex, setDraggingDocIndex] = useState(0);
  const [draggingAnnotationIndex, setDraggingAnnotationIndex] = useState(null);
  const resizeRef = useRef(null);
  const hasPreview = documents.some((d) => !!d.previewUrl);

  const hasApprovalBox = (document) =>
    (document.annotations || []).some(
      (annotation) => annotation.type === "status"
    );

  useEffect(() => {
    if (!isDragging) return undefined;

    const handlePointerMove = (event) => {
      // when dragging an already-placed status, move it live
      if (dragSource === "preview") {
        const previewEl = previewRefs.current[draggingDocIndex] || previewContainerRef.current;
        const rect = previewEl?.getBoundingClientRect();
        if (rect && draggingAnnotationIndex != null) {
          const nextX = Math.min(
            Math.max(event.clientX - rect.left - statusSize.width / 2, 12),
            Math.max(rect.width - statusSize.width - 12, 12)
          );
          const bottomAnchorY = Math.max(rect.height - statusSize.height - 120, rect.height * 0.6, 12);
          let nextY = Math.min(
            Math.max(event.clientY - rect.top - statusSize.height / 2, 12),
            Math.max(rect.height - statusSize.height - 12, 12)
          );
          if (nextY < bottomAnchorY) nextY = bottomAnchorY;

          setStatusPlacement({ x: nextX, y: nextY });
          // update document annotation live
          setDocuments((prev) => {
            const copy = [...prev];
            copy[draggingDocIndex] = { ...copy[draggingDocIndex] };
            copy[draggingDocIndex].annotations = copy[draggingDocIndex].annotations || [];
            const annotation = copy[draggingDocIndex].annotations[draggingAnnotationIndex] || {};
            const ratioConfig = {
              xRatio: nextX / rect.width,
              yRatio: nextY / rect.height,
              widthRatio: statusSize.width / rect.width,
              heightRatio: statusSize.height / rect.height,
            };
            copy[draggingDocIndex].annotations[draggingAnnotationIndex] = {
              ...annotation,
              type: "status",
              x: nextX,
              y: nextY,
              width: statusSize.width,
              height: statusSize.height,
              fields: annotation.fields || APPROVAL_BOX_FIELDS,
              ...ratioConfig,
            };
            return copy;
          });
        }
        return;
      }

      setDragGhostPosition({ x: event.clientX, y: event.clientY });
    };

    const handlePointerUp = (event) => {
      // find which preview (if any) the pointer is over
      let targetIndex = -1;
      for (let i = 0; i < previewRefs.current.length; i++) {
        const el = previewRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex !== -1) {
        const previewRect = previewRefs.current[targetIndex]?.getBoundingClientRect();
        const nextX = Math.min(
          Math.max(event.clientX - previewRect.left - statusSize.width / 2, 12),
          Math.max(previewRect.width - statusSize.width - 12, 12)
        );
        const bottomAnchorY = Math.max(previewRect.height - statusSize.height - 120, previewRect.height * 0.6, 12);
        let nextY = Math.min(
          Math.max(event.clientY - previewRect.top - statusSize.height / 2, 12),
          Math.max(previewRect.height - statusSize.height - 12, 12)
        );
        if (nextY < bottomAnchorY) nextY = bottomAnchorY;

        setStatusPlacement({ x: nextX, y: nextY });
        setIsStatusPlacedOnPreview(true);
        setDraggingDocIndex(targetIndex);

        const ratioConfig = previewRect
          ? {
              xRatio: nextX / previewRect.width,
              yRatio: nextY / previewRect.height,
              widthRatio: statusSize.width / previewRect.width,
              heightRatio: statusSize.height / previewRect.height,
            }
          : {};

        if (dragSource === "side") {
          const newAnnotation = {
            id: Date.now() + Math.random(),
            type: "status",
            x: nextX,
            y: nextY,
            width: statusSize.width,
            height: statusSize.height,
            fields: APPROVAL_BOX_FIELDS,
            ...ratioConfig,
          };
          setDocuments((prev) => {
            const copy = [...prev];
            copy[targetIndex] = { ...copy[targetIndex] };
            copy[targetIndex].annotations = copy[targetIndex].annotations || [];
            copy[targetIndex].annotations = [...copy[targetIndex].annotations, newAnnotation];
            setDraggingAnnotationIndex(copy[targetIndex].annotations.length - 1);
            return copy;
          });
        } else {
          const annotationIndex = draggingAnnotationIndex ?? 0;
          setDocuments((prev) => {
            const copy = [...prev];
            copy[targetIndex] = { ...copy[targetIndex] };
            copy[targetIndex].annotations = copy[targetIndex].annotations || [];
            const existingAnnotation = copy[targetIndex].annotations[annotationIndex] || {};
            copy[targetIndex].annotations[annotationIndex] = {
              ...existingAnnotation,
              x: nextX,
              y: nextY,
              width: existingAnnotation.width || statusSize.width,
              height: existingAnnotation.height || statusSize.height,
              ...ratioConfig,
            };
            return copy;
          });
        }
      } else if (dragSource === "preview") {
        // keep it placed where it was
        setIsStatusPlacedOnPreview(true);
      } else {
        setIsStatusPlacedOnPreview(false);
      }

      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragSource, isDragging, draggingAnnotationIndex, statusSize]);

  useEffect(() => {
    const updatePreviewDims = () => {
      const dims = previewRefs.current.map((el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return rect ? { width: rect.width, height: rect.height } : null;
      });
      setPreviewDims(dims);
    };

    updatePreviewDims();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      updatePreviewDims();
    });

    previewRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [documents.length, documents.map((doc) => doc.previewUrl).join("|")] );

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const handleFileChange = (index, event) => {
    const file = event.target.files[0];
    const updatedDocuments = [...documents];

    if (updatedDocuments[index].previewUrl) {
      URL.revokeObjectURL(updatedDocuments[index].previewUrl);
    }

    updatedDocuments[index].file = file;
    updatedDocuments[index].previewUrl = file ? URL.createObjectURL(file) : "";

    setDocuments(updatedDocuments);
  };

  const handleAddFile = () => {
    setDocuments([
      ...documents,
      {
        file: null,
        previewUrl: "",
        approvers: [{ email: "" }],
        annotations: [],
      },
    ]);
  };

  const handleRemoveFile = (index) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);

    if (documents[index]?.previewUrl) {
      URL.revokeObjectURL(documents[index].previewUrl);
    }

    if (updatedDocuments.length === 0) {
      updatedDocuments.push({ file: null, previewUrl: "", approvers: [{ email: "" }], annotations: [] });
    }

    setDocuments(updatedDocuments);
  };

  const handleApproverEmailChange = (documentIndex, approverIndex, value) => {
    const updatedDocuments = [...documents];
    updatedDocuments[documentIndex].approvers[approverIndex].email = value;
    setDocuments(updatedDocuments);
  };

  const addApproverEmail = (documentIndex) => {
    const updatedDocuments = [...documents];
    updatedDocuments[documentIndex].approvers.push({ email: "" });
    setDocuments(updatedDocuments);
  };

  const removeApproverEmail = (documentIndex, approverIndex) => {
    const updatedDocuments = [...documents];
    updatedDocuments[documentIndex].approvers.splice(approverIndex, 1);

    if (updatedDocuments[documentIndex].approvers.length === 0) {
      updatedDocuments[documentIndex].approvers.push({ email: "" });
    }

    setDocuments(updatedDocuments);
  };

  const canSubmit =
    documents.every((doc) => !doc.file || hasApprovalBox(doc)) &&
    documents.some((doc) => doc.file) &&
    documents.some((doc) => doc.approvers.some((app) => app.email.trim()));

  const handleDragStart = (event, source = "side", documentIndex = 0, annotationIndex = null) => {
    event.preventDefault();
    event.stopPropagation();
    // only allow starting a drag from the side when a preview exists
    if (source === "side" && !documents.some((d) => !!d.previewUrl)) return;
    try {
      // capture the pointer so pointermove/up continue even when over an iframe
      if (event.pointerId && event.currentTarget && event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    } catch (e) {
      // ignore capture errors
    }
    if (source === "preview" && annotationIndex != null) {
      const annotation = documents[documentIndex]?.annotations?.[annotationIndex];
          if (annotation) {
            setStatusPlacement({ x: annotation.x, y: annotation.y });
            setStatusSize({ width: annotation.width, height: annotation.height });
      }
    }
    setDragSource(source);
    setDraggingDocIndex(documentIndex);
    setDraggingAnnotationIndex(annotationIndex);
    setIsDragging(true);
    setDragGhostPosition({ x: event.clientX, y: event.clientY });
  };

  const handleResizeStart = (event, documentIndex, annotationIndex) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      // capture the pointer so resizing continues if pointer moves over iframe
      if (event.pointerId && event.currentTarget && event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    } catch (e) {
      // ignore
    }

    const annotation = documents[documentIndex]?.annotations?.[annotationIndex];
    const startWidth = annotation?.width ?? statusSize.width;
    const startHeight = annotation?.height ?? statusSize.height;

    if (annotation) {
      setStatusSize({ width: annotation.width, height: annotation.height });
      setStatusPlacement({ x: annotation.x, y: annotation.y });
    }

    // stop any active drag while resizing
    setDragSource("preview");
    setDraggingDocIndex(documentIndex);
    setDraggingAnnotationIndex(annotationIndex);
    setIsDragging(false);

    const startX = event.clientX;
    const startY = event.clientY;

    const handleResizeMove = (moveEvent) => {
      const nextWidth = Math.max(130, startWidth + (moveEvent.clientX - startX));
      const nextHeight = Math.max(46, startHeight + (moveEvent.clientY - startY));
      setStatusSize({ width: nextWidth, height: nextHeight });

      const previewEl = previewRefs.current[documentIndex];
      const previewRect = previewEl?.getBoundingClientRect();
      const ratioConfig = previewRect
        ? {
            xRatio: annotation?.x / previewRect.width,
            yRatio: annotation?.y / previewRect.height,
            widthRatio: nextWidth / previewRect.width,
            heightRatio: nextHeight / previewRect.height,
          }
        : {};

      // update annotation size live
      setDocuments((prev) => {
        const copy = [...prev];
        copy[documentIndex] = { ...copy[documentIndex] };
        copy[documentIndex].annotations = copy[documentIndex].annotations || [];
        const currentAnnotation = copy[documentIndex].annotations[annotationIndex] || {};
        copy[documentIndex].annotations[annotationIndex] = {
          ...currentAnnotation,
          type: "status",
          x: currentAnnotation.x ?? statusPlacement.x,
          y: currentAnnotation.y ?? statusPlacement.y,
          width: nextWidth,
          height: nextHeight,
          fields: currentAnnotation.fields || APPROVAL_BOX_FIELDS,
          ...ratioConfig,
        };
        return copy;
      });
    };

    const handleResizeEnd = () => {
      window.removeEventListener("pointermove", handleResizeMove);
      window.removeEventListener("pointerup", handleResizeEnd);
    };

    window.addEventListener("pointermove", handleResizeMove);
    window.addEventListener("pointerup", handleResizeEnd);
  };

  const handleSubmit = async () => {
    if (!user || !user.email) {
      alert("Please login again.");
      navigate("/login");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {
      setIsSubmitting(true);

      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];

        if (!document.file) {
          alert(`Please select a file for Document ${i + 1}.`);
          return;
        }

        const emails = document.approvers.map((approver) => approver.email.trim()).filter(Boolean);

        if (!hasApprovalBox(document)) {
          alert(`Please place the approval box on Document ${i + 1} before submitting.`);
          return;
        }

        if (emails.length === 0) {
          alert(`Please enter at least one approver email for Document ${i + 1}.`);
          return;
        }

        for (const email of emails) {
          if (!emailRegex.test(email)) {
            alert(`Please enter a valid email: ${email}`);
            return;
          }

          await validateApprover(email);
        }
      }

      const response = await uploadDocuments(documents, user.email, previewRefs.current);
      alert(response.message);

      setDocuments([{ file: null, previewUrl: "", approvers: [{ email: "" }], annotations: [] }]);
    } catch (error) {
      alert(error.response?.data?.message || "Validation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document Approval System
          </Typography>
          <Typography sx={{ mr: 3 }}>{user?.email}</Typography>
          {user?.role === "ADMIN" && (
            <Button
              variant="outlined"
              color="inherit"
              sx={{ mr: 2, color: "#fff", borderColor: "#fff" }}
              onClick={() => navigate("/register")}
            >
              Register
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            sx={{ mr: 2 }}
            onClick={() => navigate("/user/my-documents")}
          >
            My Documents
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ color: "#fff", borderColor: "#fff" }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          User Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Upload one or more documents for approval.
        </Typography>

        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Upload Documents
          </Typography>

          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
            <Box sx={{ flex: 1, minWidth: { xs: "100%", lg: 0 } }}>
              <Stack spacing={3}>
                {documents.map((document, documentIndex) => (
                  <Paper key={documentIndex} elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {document.file ? document.file.name : `Document ${documentIndex + 1}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {document.file
                            ? `${(document.file.size / 1024).toFixed(2)} KB - ${document.file.type || "Unknown"}`
                            : "Choose a file to attach to this document."}
                        </Typography>
                        {document.file && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.8,
                              color: hasApprovalBox(document) ? "success.main" : "warning.main",
                              fontWeight: 600,
                            }}
                          >
                            {hasApprovalBox(document)
                              ? "Approval box placed"
                              : "Place the approval box on this document before upload"}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button variant="outlined" component="label">
                          Choose File
                          <input
                            hidden
                            id={`document-file-${documentIndex}`}
                            name={`documentFile_${documentIndex}`}
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(event) => handleFileChange(documentIndex, event)}
                          />
                        </Button>
                        {documents.length > 1 && (
                          <Button color="error" variant="contained" onClick={() => handleRemoveFile(documentIndex)}>
                            Remove
                          </Button>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 3, position: "relative" }} ref={(el) => { previewRefs.current[documentIndex] = el; previewContainerRef.current = el; }}>
                      {document.previewUrl ? (
                        <>
                          {document.file?.type.startsWith("image/") ? (
                            <img
                              src={document.previewUrl}
                              alt={document.file?.name || "Document preview"}
                              style={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 12 }}
                            />
                          ) : (
                            <iframe
                              title={document.file?.name || "Document preview"}
                              src={document.previewUrl}
                              style={{ width: "100%", height: 360, border: "none", borderRadius: 12 }}
                            />
                          )}

                          {document.annotations?.map((annotation, annotationIndex) => {
                            const dims = previewDims[documentIndex] || {};
                            const width =
                              annotation.widthRatio != null && dims.width
                                ? annotation.widthRatio * dims.width
                                : annotation.width || 240;
                            const minHeight =
                              annotation.heightRatio != null && dims.height
                                ? annotation.heightRatio * dims.height
                                : annotation.height || 156;
                            const left =
                              annotation.xRatio != null && dims.width
                                ? annotation.xRatio * dims.width
                                : annotation.x ?? 16;
                            const top =
                              annotation.yRatio != null && dims.height
                                ? annotation.yRatio * dims.height
                                : annotation.y ?? 16;
                            const scale = Math.max(
                              0.75,
                              Math.min(1, Math.min(width / 240, minHeight / 156))
                            );

                            return (
                              <Box
                                key={annotation.id || annotationIndex}
                                ref={annotationIndex === draggingAnnotationIndex ? resizeRef : null}
                                sx={{
                                  position: "absolute",
                                  left,
                                  top,
                                  zIndex: 2,
                                  width,
                                  minHeight,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  gap: 0.35,
                                  px: 1.4,
                                  py: 1,
                                  borderRadius: 6,
                                  bgcolor: "rgba(255,245,230,0.35)",
                                  border: "3px dashed #ffb74d",
                                  boxShadow: 1,
                                  cursor: "move",
                                  userSelect: "none",
                                  touchAction: "none",
                                  overflow: "hidden",
                                  fontSize: `${scale}rem`,
                                  lineHeight: 1.2,
                                  "& .MuiTypography-root": {
                                    fontSize: "inherit",
                                  },
                                }}
                                onPointerDown={(event) => handleDragStart(event, "preview", documentIndex, annotationIndex)}
                              >
                                <Typography variant="body2" fontWeight={700} sx={{ color: "#ef6c00" }}>
                                  Approval Box
                                </Typography>
                                {(annotation.fields || APPROVAL_BOX_FIELDS).map((fieldLabel) => (
                                  <Typography key={fieldLabel} variant="body2" sx={{ color: "#424242" }}>
                                    {fieldLabel}
                                  </Typography>
                                ))}
                                <Box
                                  sx={{
                                    position: "absolute",
                                    right: 6,
                                    bottom: 6,
                                    width: 14,
                                    height: 14,
                                    transform: "rotate(45deg)",
                                    borderRight: "4px solid #ef6c00",
                                    borderBottom: "4px solid #ef6c00",
                                    cursor: "nwse-resize",
                                  }}
                                  onPointerDown={(event) => handleResizeStart(event, documentIndex, annotationIndex)}
                                />
                              </Box>
                            );
                          })}
                        </>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            minHeight: 220,
                            color: "text.secondary",
                            border: "1px dashed #c5d2e8",
                            borderRadius: 3,
                            p: 4,
                          }}
                        >
                          <UploadFileIcon sx={{ fontSize: 48, color: "primary.main" }} />
                          <Typography variant="body1" fontWeight="bold">
                            Document preview will appear here.
                          </Typography>
                          <Typography variant="body2" textAlign="center">
                            Upload a PDF or image to preview the document.
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      Approver Emails
                    </Typography>

                    <Stack spacing={2}>
                      {document.approvers.map((approver, approverIndex) => (
                        <Box
                          key={approverIndex}
                          sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}
                        >
                          <TextField
                            id={`approver-email-${documentIndex}-${approverIndex}`}
                            name={`approverEmail_${documentIndex}_${approverIndex}`}
                            label={`Email ${approverIndex + 1}`}
                            type="email"
                            autoComplete="email"
                            fullWidth
                            required
                            placeholder="Enter approver email"
                            value={approver.email}
                            onChange={(event) =>
                              handleApproverEmailChange(documentIndex, approverIndex, event.target.value)
                            }
                            size="small"
                          />
                          {document.approvers.length > 1 && (
                            <Button
                              variant="text"
                              color="error"
                              startIcon={<RemoveCircleOutlineIcon />}
                              onClick={() => removeApproverEmail(documentIndex, approverIndex)}
                            >
                              Remove
                            </Button>
                          )}
                        </Box>
                      ))}
                    </Stack>

                    <Box sx={{ mt: 2 }}>
                      <Button startIcon={<AddCircleOutlineIcon />} onClick={() => addApproverEmail(documentIndex)}>
                        Add approver email
                      </Button>
                    </Box>
                  </Paper>
                ))}

                <Box>
                  <Button variant="contained" onClick={handleAddFile}>
                    + Add More Files
                  </Button>
                </Box>

                <Box>
                  <Button variant="contained" color="success" size="large" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "Uploading..." : "Submit"}
                  </Button>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ width: { xs: "100%", lg: 320 }, minHeight: 320, position: "relative" }}>
              
                <Paper elevation={4} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#fcfdff", border: "1px solid #dce6f3" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Approval Summary
                    </Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: 1.1,
                        p: 1.4,
                        borderRadius: 2,
                        bgcolor: "#f5f7fb",
                        cursor: hasPreview ? "grab" : "not-allowed",
                        userSelect: "none",
                        touchAction: "none",
                        opacity: hasPreview ? 1 : 0.6,
                      }}
                      onPointerDown={(event) => { if (hasPreview) handleDragStart(event, "side"); else event.preventDefault(); }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DragIndicatorIcon color={hasPreview ? "primary" : "disabled"} />
                        <CheckCircleOutlinedIcon color="success" />
                        <Typography variant="body2" fontWeight={700}>Approval Box</Typography>
                      </Box>
                      {APPROVAL_BOX_FIELDS.map((fieldLabel) => (
                        <Typography key={fieldLabel} variant="body2" sx={{ color: "text.secondary", pl: 0.5 }}>
                          {fieldLabel}
                        </Typography>
                      ))}
                    </Box>
                  </Stack>
                </Paper>


              {isDragging && (
                <Box
                  sx={{
                    position: "fixed",
                    left: dragGhostPosition.x - (statusSize.width / 2),
                    top: dragGhostPosition.y - (statusSize.height / 2),
                    width: statusSize.width,
                    minHeight: statusSize.height,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    px: 1.4,
                    py: 1,
                    borderRadius: 6,
                    bgcolor: "rgba(255,245,230,0.35)",
                    border: "3px dashed #ffb74d",
                    boxShadow: 1,
                    zIndex: 10,
                    pointerEvents: "none",
                    flexDirection: "column",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#ef6c00", fontWeight: 700 }}>
                    Approval Box
                  </Typography>
                  {APPROVAL_BOX_FIELDS.map((fieldLabel) => (
                    <Typography key={fieldLabel} variant="body2" sx={{ color: "#424242" }}>
                      {fieldLabel}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default UserDashboard;
